import math
import random
from decimal import Decimal

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) * math.sin(dlat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dlon / 2) * math.sin(dlon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

def calculate_fare(pickup_lat, pickup_lon, dropoff_lat, dropoff_lon):
    # 1. Calculate Distance
    distance_km = haversine_distance(pickup_lat, pickup_lon, dropoff_lat, dropoff_lon)
    
    # 2. Simulate Traffic (For MVP, randomized slightly for variety)
    # 20% chance of heavy traffic
    is_heavy_traffic = random.random() < 0.2
    traffic_factor = 1.5 if is_heavy_traffic else 1.0
    
    # 3. Calculate Parameters
    # Assume avg speed 20 km/h in city
    avg_speed_kmh = 20 / traffic_factor 
    duration_hours = distance_km / avg_speed_kmh
    duration_minutes = int(duration_hours * 60)
    
    # 4. Price Logic
    base_fare = 50.0
    per_km_rate = 25.0
    per_minute_rate = 3.0
    
    distance_cost = distance_km * per_km_rate
    time_cost = duration_minutes * per_minute_rate
    
    total_fare = (base_fare + distance_cost + time_cost) * traffic_factor
    
    return {
        "estimated_fare": round(Decimal(total_fare), 2),
        "distance_km": round(distance_km, 2),
        "duration_minutes": duration_minutes,
        "traffic_factor": traffic_factor,
        "traffic_status": "Heavy" if is_heavy_traffic else "Normal"
    }
