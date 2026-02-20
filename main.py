import os
import asyncio
import mimetypes
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import SQLModel, create_engine, Session, select

from backend.models import Ride, TrackPoint, BestEffort
from backend.gps_manager import GPSManager
from backend.gpx_parser import import_gpx
from backend.physics import calculate_calories

# --- FIX 1: Explicitly set MIME types for Termux ---
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')

# --- FIX 2: Use Absolute Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DIST_DIR = os.path.join(BASE_DIR, "frontend/dist")
ASSETS_DIR = os.path.join(DIST_DIR, "assets")

os.makedirs(DATA_DIR, exist_ok=True)
engine = create_engine(f"sqlite:///{DATA_DIR}/cycling.db")

gps_manager = GPSManager(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    asyncio.create_task(gps_manager.loop())
    yield

app = FastAPI(lifespan=lifespan)

# --- FIX 3: Robust Static File Mounting ---
if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    gps_manager.connections.append(websocket)
    try:
        while True: await websocket.receive_text()
    except:
        if websocket in gps_manager.connections:
            gps_manager.connections.remove(websocket)

@app.post("/api/control/{action}")
def control_ride(action: str):
    if action == "start":
        with Session(engine) as session:
            ride = Ride(start_time=datetime.now())
            session.add(ride)
            session.commit()
            gps_manager.current_ride_id = ride.id
            gps_manager.is_recording = True
            gps_manager.is_paused = False
            gps_manager.point_buffer = []
    elif action == "pause":
        gps_manager.is_paused = True
    elif action == "resume":
        gps_manager.is_paused = False
    elif action == "stop":
        gps_manager.flush_buffer()
        gps_manager.is_recording = False
        with Session(engine) as session:
            if gps_manager.current_ride_id:
                ride = session.get(Ride, gps_manager.current_ride_id)
                if ride:
                    ride.end_time = datetime.now()
                    ride.calories = calculate_calories(ride.avg_power_watts, ride.moving_time_seconds)
                    session.add(ride)
                    session.commit()
        gps_manager.current_ride_id = None
    return {"status": "ok"}

@app.get("/api/history")
def get_history():
    with Session(engine) as session:
        return session.exec(select(Ride).order_by(Ride.start_time.desc())).all()

@app.get("/api/rides/{ride_id}")
def get_ride(ride_id: int):
    with Session(engine) as session:
        ride = session.get(Ride, ride_id)
        if not ride: return {"error": "Ride not found"}
        points = session.exec(select(TrackPoint).where(TrackPoint.ride_id == ride_id).order_by(TrackPoint.timestamp)).all()
        efforts = session.exec(select(BestEffort).where(BestEffort.ride_id == ride_id)).all()
        
        path = [[p.latitude, p.longitude] for i, p in enumerate(points) if i % 3 == 0]
        
        return {"ride": ride, "path": path, "points": points, "achievements": efforts}

@app.post("/api/import/gpx")
async def upload_gpx(file: UploadFile = File(...)):
    content = await file.read()
    with Session(engine) as session:
        ride_id = import_gpx(content, session)
        return {"status": "success", "ride_id": ride_id}

# --- FIX 4: Dedicated Catch-All + Root Handler ---
@app.get("/{full_path:path}")
def serve_react_app(full_path: str):
    # This checks for the built index.html regardless of where the script is run
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend not built. Run 'npm run build' in frontend/ directory."}
