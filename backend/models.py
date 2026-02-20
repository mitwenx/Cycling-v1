from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class Ride(SQLModel, table=True):
    id: Optional = Field(default=None, primary_key=True)
    start_time: datetime
    end_time: Optional = None
    total_distance_km: float = 0.0
    moving_time_seconds: float = 0.0
    elapsed_time_seconds: float = 0.0
    elevation_gain: float = 0.0   
    calories: int = 0             
    avg_speed_kph: float = 0.0
    max_speed_kph: float = 0.0
    avg_power_watts: int = 0
    points: List = Relationship(back_populates="ride", cascade_delete=True)

class TrackPoint(SQLModel, table=True):
    id: Optional = Field(default=None, primary_key=True)
    ride_id: Optional = Field(default=None, foreign_key="ride.id")
    timestamp: float
    latitude: float
    longitude: float
    altitude: float
    speed_ms: float
    power_watts: int = 0
    ride: Optional = Relationship(back_populates="points")

class BestEffort(SQLModel, table=True):
    id: Optional = Field(default=None, primary_key=True)
    effort_type: str  
    value_context: float  
    result_value: float  
    date_achieved: datetime
    ride_id: int = Field(foreign_key="ride.id")
    start_index: int = 0
    end_index: int = 0

class SavedRoute(SQLModel, table=True):
    id: Optional = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.now)
    total_distance_km: float
    estimated_elevation_m: float
    points_json: str
