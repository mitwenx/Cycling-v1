import math

RIDER_MASS_KG = 70.0  
BIKE_MASS_KG = 14.0
C_ROLLING_RESISTANCE = 0.005 
C_DRAG = 0.32  
AIR_DENSITY = 1.225
GRAVITY = 9.81

def calculate_power(speed_ms: float, slope_grade: float) -> int:
    if speed_ms < 0.5: return 0
    total_mass = RIDER_MASS_KG + BIKE_MASS_KG
    safe_grade = max(min(slope_grade, 0.25), -0.25) 
    
    f_gravity = total_mass * GRAVITY * safe_grade
    f_rolling = total_mass * GRAVITY * C_ROLLING_RESISTANCE
    f_drag = 0.5 * AIR_DENSITY * C_DRAG * (speed_ms ** 2)
    
    total_force = f_gravity + f_rolling + f_drag
    if total_force < 0: return 0 # Coasting down hill
    return int(total_force * speed_ms)

def calculate_calories(avg_watts: float, moving_time_seconds: float) -> int:
    if moving_time_seconds <= 0: return 0
    work_joules = avg_watts * moving_time_seconds
    exercise_kcal = (work_joules / 0.24) / 4184 # Human efficiency ~24%
    base_burn = 0.02 * moving_time_seconds
    return int(exercise_kcal + base_burn)

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371 
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * 
         math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2)
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))
