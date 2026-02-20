import os
import asyncio
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

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
engine = create_engine(f"sqlite:///{DATA_DIR}/cycling.db")

gps_manager = GPSManager(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    asyncio.create_task(gps_manager.loop())
    yield

app = FastAPI(lifespan=lifespan)

if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

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
        
        # Fixed list comprehension here
        path = [[p.latitude, p.longitude] for i, p in enumerate(points) if i % 3 == 0]
        
        return {"ride": ride, "path": path, "points": points, "achievements": efforts}

@app.post("/api/import/gpx")
async def upload_gpx(file: UploadFile = File(...)):
    content = await file.read()
    with Session(engine) as session:
        ride_id = import_gpx(content, session)
        return {"status": "success", "ride_id": ride_id}

@app.get("/{full_path:path}")
def serve_react_app(full_path: str):
    if os.path.exists("frontend/dist/index.html"):
        return FileResponse("frontend/dist/index.html")
    return {"error": "Frontend not built."}
