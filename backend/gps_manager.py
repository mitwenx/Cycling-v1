import asyncio, json, subprocess, time, shutil, os
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from sqlmodel import Session
from backend.models import Ride, TrackPoint
from backend.physics import haversine_distance, calculate_power, calculate_calories

class GPSManager:
    def __init__(self, engine):
        self.engine = engine
        self.is_recording = False
        self.is_paused = False
        self.current_ride_id = None
        self.connections = []
        self.point_buffer =[]
        self.altitude_buffer = deque(maxlen=5) 
        self.last_valid_point = None
        self.last_grade_checkpoint = None
        self.last_elev_checkpoint = None
        
        self.termux_bin = shutil.which("termux-location") or "/data/data/com.termux/files/usr/bin/termux-location"
        self._executor = ThreadPoolExecutor(max_workers=2)

    async def broadcast(self, data: dict):
        dead_connections =[]
        for ws in self.connections:
            try:
                await ws.send_json(data)
            except:
                dead_connections.append(ws)
        for ws in dead_connections:
            self.connections.remove(ws)

    def _poll_gps(self, provider="gps"):
        try:
            cmd =
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                return json.loads(res.stdout)
        except: pass
        return None

    async def loop(self):
        loop = asyncio.get_running_loop()
        while True:
            t_start = time.time()
            data = await loop.run_in_executor(self._executor, self._poll_gps, "gps")
            if not data or "API_ERROR" in data:
                data = await loop.run_in_executor(self._executor, self._poll_gps, "network")

            if data and "latitude" in data:
                lat, lon = data, data
                speed_ms = data.get('speed', 0)
                raw_alt = data.get('altitude', 0)
                bearing = data.get('bearing', 0)
                
                self.altitude_buffer.append(raw_alt)
                smooth_alt = sum(self.altitude_buffer) / len(self.altitude_buffer)
                ts = time.time()
                
                stats = {
                    "lat": lat, "lon": lon, "speed_kph": speed_ms * 3.6, "bearing": bearing,
                    "dist_km": 0, "power": 0, "time": 0, "status": "Connected",
                    "recording": self.is_recording, "paused": self.is_paused
                }

                if self.is_recording and not self.is_paused:
                    dt = min(ts - self.last_valid_point, 2.0) if self.last_valid_point else 0
                    dist_delta = haversine_distance(self.last_valid_point, self.last_valid_point, lat, lon) if self.last_valid_point else 0
                    
                    is_moving = (speed_ms * 3.6) > 3.0
                    grade, elev_delta = 0.0, 0.0

                    if self.last_grade_checkpoint:
                        g_dist = haversine_distance(self.last_grade_checkpoint, self.last_grade_checkpoint, lat, lon)
                        if g_dist > 0.02:
                            grade = (smooth_alt - self.last_grade_checkpoint) / (g_dist * 1000)
                            self.last_grade_checkpoint = {'lat': lat, 'lon': lon, 'alt': smooth_alt}
                    else:
                        self.last_grade_checkpoint = {'lat': lat, 'lon': lon, 'alt': smooth_alt}

                    if self.last_elev_checkpoint is None: self.last_elev_checkpoint = smooth_alt
                    elif (smooth_alt - self.last_elev_checkpoint) > 1.5:
                        elev_delta = smooth_alt - self.last_elev_checkpoint
                        self.last_elev_checkpoint = smooth_alt

                    if is_moving:
                        watts = calculate_power(speed_ms, grade)
                        tp = TrackPoint(ride_id=self.current_ride_id, timestamp=ts, latitude=lat, longitude=lon, altitude=smooth_alt, speed_ms=speed_ms, power_watts=watts)
                        
                        with Session(self.engine) as session:
                            ride = session.get(Ride, self.current_ride_id)
                            if ride:
                                ride.total_distance_km += dist_delta
                                ride.moving_time_seconds += dt
                                ride.elevation_gain += elev_delta
                                ride.max_speed_kph = max(ride.max_speed_kph, speed_ms * 3.6)
                                ride.avg_power_watts = int((ride.avg_power_watts * 0.95) + (watts * 0.05)) if ride.avg_power_watts else watts
                                session.commit()
                                
                                stats.update({
                                    "dist_km": ride.total_distance_km,
                                    "power": watts, "time": ride.moving_time_seconds
                                })
                        
                        self.point_buffer.append(tp)
                        self.last_valid_point = {'lat': lat, 'lon': lon, 'alt': smooth_alt, 'ts': ts}
                        if len(self.point_buffer) >= 5: self.flush_buffer()
                    else:
                        stats = "Auto-Pause"
                        stats = 0.0
                
                if not self.is_recording:
                    self.last_valid_point = {'lat': lat, 'lon': lon, 'alt': smooth_alt, 'ts': ts}
                
                await self.broadcast(stats)

            elapsed = time.time() - t_start
            await asyncio.sleep(max(1.0 - elapsed, 0.1))

    def flush_buffer(self):
        if not self.point_buffer: return
        with Session(self.engine) as session:
            session.add_all(self.point_buffer)
            session.commit()
        self.point_buffer =[]
