import os
import asyncio
import json
import mimetypes
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List

from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from sqlmodel import SQLModel, create_engine, Session, select
from pydantic import BaseModel

from backend.models import Ride, TrackPoint, BestEffort, SavedRoute
from backend.gps_manager import GPSManager
from backend.gpx_parser import import_gpx
from backend.physics import calculate_calories

mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')

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

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    gps_manager.connections.append(websocket)
    try:
        while True: 
            await websocket.receive_text()
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
                    if ride.moving_time_seconds > 0:
                        ride.avg_speed_kph = ride.total_distance_km / (ride.moving_time_seconds / 3600)
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

class RouteCreate(BaseModel):
    name: str
    distance_km: float
    elevation_m: float
    points: List[List[float]]

@app.post("/api/routes")
def save_route(route_data: RouteCreate):
    with Session(engine) as session:
        new_route = SavedRoute(
            name=route_data.name,
            total_distance_km=route_data.distance_km,
            estimated_elevation_m=route_data.elevation_m,
            points_json=json.dumps(route_data.points)
        )
        session.add(new_route)
        session.commit()
        return {"status": "success", "id": new_route.id}

@app.get("/api/routes")
def get_routes():
    with Session(engine) as session:
        routes = session.exec(select(SavedRoute).order_by(SavedRoute.created_at.desc())).all()
        result = []
        for r in routes:
            result.append({
                "id": r.id,
                "name": r.name,
                "distance": r.total_distance_km,
                "elevation": r.estimated_elevation_m,
                "points": json.loads(r.points_json)
            })
        return result

@app.delete("/api/routes/{route_id}")
def delete_route(route_id: int):
    with Session(engine) as session:
        route = session.get(SavedRoute, route_id)
        if route:
            session.delete(route)
            session.commit()
        return {"status": "deleted"}

@app.get("/api/statistics")
def get_statistics():
    with Session(engine) as session:
        all_rides = session.exec(select(Ride)).all()
        valid_rides = [r for r in all_rides if r.total_distance_km > 0.1]
        
        total_dist = sum(r.total_distance_km for r in valid_rides)
        total_time = sum(r.moving_time_seconds for r in valid_rides)
        total_elev = sum(r.elevation_gain for r in valid_rides)
        records = session.exec(select(BestEffort).order_by(BestEffort.effort_type)).all()
        
        return {
            "all_time": {"dist": total_dist, "time": total_time, "elev": total_elev, "count": len(valid_rides)},
            "records": records
        }

class ExportRequest(BaseModel):
    ride_ids: List[int]

@app.post("/api/export/text")
def export_training_data(request: ExportRequest):
    with Session(engine) as session:
        query = select(Ride).where(Ride.id.in_(request.ride_ids)).order_by(Ride.start_time.asc())
        rides = session.exec(query).all()
        
        lines = []
        lines.append("CYLING TRAINING DATA EXPORT")
        lines.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("=" * 50)
        lines.append("")

        total_dist = sum(r.total_distance_km for r in rides)
        total_elev = sum(r.elevation_gain for r in rides)
        total_cals = sum(r.calories for r in rides)
        
        lines.append(f"SECTION 1: SELECTED PERIOD SUMMARY")
        lines.append(f"- Total Rides: {len(rides)}")
        lines.append(f"- Total Distance: {total_dist:.2f} km")
        lines.append(f"- Total Elevation Gain: {int(total_elev)} m")
        lines.append(f"- Total Calories: {total_cals}")
        lines.append("")
        lines.append("SECTION 2: DETAILED RIDE LOG")
        lines.append("-" * 50)

        for ride in rides:
            date_str = ride.start_time.strftime('%Y-%m-%d')
            line = (f"DATE: {date_str} | DIST: {ride.total_distance_km:.2f}km | "
                    f"ELEV: {int(ride.elevation_gain)}m | "
                    f"AVG SPD: {ride.avg_speed_kph:.1f}kph | PWR: {ride.avg_power_watts}W | CAL: {ride.calories}")
            lines.append(line)
        
        content = "\n".join(lines)
        return Response(content=content, media_type="text/plain", headers={"Content-Disposition": "attachment; filename=training_data.txt"})

@app.get("/{full_path:path}")
def serve_react_app(full_path: str):
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "Frontend not built. Run 'npm run build' in frontend/ directory."}
