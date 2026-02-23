

import xml.etree.ElementTree as ET
from io import BytesIO
from datetime import datetime
from sqlmodel import Session
from backend.models import Ride, TrackPoint
from backend.physics import haversine_distance, calculate_power, calculate_calories

def import_gpx(content: bytes, session: Session) -> int:
    # Strip namespaces for easy parsing
    it = ET.iterparse(BytesIO(content))
    for _, el in it:
        _, _, el.tag = el.tag.rpartition('}')
    root = it.root

    points = []
    for trkpt in root.findall('.//trkpt'):
        lat = float(trkpt.get('lat'))
        lon = float(trkpt.get('lon'))
        ele_el = trkpt.find('ele')
        time_el = trkpt.find('time')
        
        ele = float(ele_el.text) if ele_el is not None else 0.0
        ts = datetime.fromisoformat(time_el.text.replace('Z', '+00:00')).timestamp() if time_el is not None else 0.0
        points.append({"lat": lat, "lon": lon, "ele": ele, "ts": ts})

    if not points: return None

    # Sort points chronologically
    points.sort(key=lambda x: x['ts'])
    
    start_time = datetime.fromtimestamp(points[0]['ts'])
    end_time = datetime.fromtimestamp(points[-1]['ts'])
    
    ride = Ride(start_time=start_time, end_time=end_time)
    session.add(ride)
    session.commit()
    session.refresh(ride)

    total_dist = 0.0
    total_time = 0.0
    total_elev = 0.0
    track_points = []
    
    last_p = points[0]
    for p in points[1:]:
        dt = p['ts'] - last_p['ts']
        dist = haversine_distance(last_p['lat'], last_p['lon'], p['lat'], p['lon'])
        speed = (dist * 1000) / dt if dt > 0 else 0
        
        if speed > 0.5: # Moving
            total_dist += dist
            total_time += dt
            
            ele_diff = p['ele'] - last_p['ele']
            if ele_diff > 1.5: 
                total_elev += ele_diff
            
            grade = ele_diff / (dist * 1000) if dist > 0 else 0
            watts = calculate_power(speed, grade)
            
            track_points.append(TrackPoint(
                ride_id=ride.id, timestamp=p['ts'], latitude=p['lat'], 
                longitude=p['lon'], altitude=p['ele'], speed_ms=speed, power_watts=watts
            ))
            
        last_p = p

    session.add_all(track_points)
    
    # Update ride totals
    ride.total_distance_km = total_dist
    ride.moving_time_seconds = total_time
    ride.elevation_gain = total_elev
    ride.calories = calculate_calories(150, total_time) # Assuming 150W avg for GPX import without power data
    
    session.add(ride)
    session.commit()
    return ride.id
