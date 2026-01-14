import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def get_token(username, password):
    res = requests.post(f"{BASE_URL}/token/", data={"username": username, "password": password})
    if res.status_code == 200:
        return res.json()['access']
    return None

def create_active_ride():
    print("--- Creating Active Ride ---")
    pax_token = get_token("verify_pax", "password123")
    driver_token = get_token("driver1", "password123")
    
    if not pax_token or not driver_token:
        print("Failed to get tokens. Run verify_full_flow.py first.")
        return

    pax_headers = {"Authorization": f"Bearer {pax_token}"}
    driver_headers = {"Authorization": f"Bearer {driver_token}"}

    # Create Ride
    print("Creating ride...")
    ride_data = {
        "pickup_latitude": 23.81,
        "pickup_longitude": 90.41,
        "pickup_address": "Chat Test Pickup",
        "dropoff_latitude": 23.82,
        "dropoff_longitude": 90.42,
        "dropoff_address": "Chat Test Dropoff"
    }
    res = requests.post(f"{BASE_URL}/rides/", json=ride_data, headers=pax_headers)
    ride = res.json()
    ride_id = ride['id']
    print(f"Ride #{ride_id} created.")

    # Accept Ride
    print("Accepting ride...")
    requests.patch(f"{BASE_URL}/rides/{ride_id}/accept/", headers=driver_headers)
    print(f"Ride #{ride_id} accepted/active.")

if __name__ == "__main__":
    create_active_ride()
