import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def get_token(username, password):
    try:
        res = requests.post(f"{BASE_URL}/token/", data={"username": username, "password": password})
        if res.status_code == 200:
            return res.json()['access']
    except Exception as e:
        print(f"Error connecting to server: {e}")
    return None

def create_user(username, email, password, role='rider'):
    token = get_token(username, password)
    if token:
        return token
    
    res = requests.post(f"{BASE_URL}/users/register/", data={
        "username": username,
        "email": email,
        "password": password,
        "role": role
    })
    if res.status_code == 201:
        print(f"User {username} created.")
        return get_token(username, password)
    print(f"Failed to register {username}: {res.text}")
    return None

def verify_full_flow():
    print("--- Starting Full Flow Verification ---")
    
    # 1. Setup
    print("[1] Setting up users...")
    passenger_token = create_user("verify_pax", "pax@test.com", "password123", "rider")
    driver_token = get_token("driver1", "password123")
    
    if not driver_token:
        # Create driver if missing
        driver_token = create_user("driver1", "driver1@example.com", "password123", "driver")
        
    if not passenger_token or not driver_token:
        print("Failed to get tokens. Is server running?")
        sys.exit(1)

    passenger_headers = {"Authorization": f"Bearer {passenger_token}"}
    driver_headers = {"Authorization": f"Bearer {driver_token}"}

    # 2. Request Ride
    print("\n[2] Passenger requesting ride...")
    ride_data = {
        "pickup_latitude": 23.81,
        "pickup_longitude": 90.41,
        "pickup_address": "Test Pickup",
        "dropoff_latitude": 23.82,
        "dropoff_longitude": 90.42,
        "dropoff_address": "Test Dropoff"
    }
    res = requests.post(f"{BASE_URL}/rides/", json=ride_data, headers=passenger_headers)
    if res.status_code != 201:
        print(f"FAILED to create ride: {res.text}")
        sys.exit(1)
    ride = res.json()
    ride_id = ride['id']
    print(f"Ride #{ride_id} created. Status: {ride['status']}")

    # 3. Accept Ride
    print(f"\n[3] Driver accepting Ride #{ride_id}...")
    res = requests.patch(f"{BASE_URL}/rides/{ride_id}/accept/", headers=driver_headers)
    if res.status_code != 200:
        print(f"FAILED to accept ride: {res.text}")
        sys.exit(1)
    print(f"Ride accepted. Status: {res.json()['status']}")

    # 4. Start Ride
    print(f"\n[4] Driver starting Ride #{ride_id}...")
    res = requests.post(f"{BASE_URL}/rides/{ride_id}/start_ride/", headers=driver_headers)
    if res.status_code != 200:
        print(f"FAILED to start ride: {res.text}")
        sys.exit(1)
    print(f"Ride started. Status: {res.json()['status']}")

    # 5. Complete Ride
    print(f"\n[5] Driver completing Ride #{ride_id}...")
    res = requests.post(f"{BASE_URL}/rides/{ride_id}/complete_ride/", headers=driver_headers)
    if res.status_code != 200:
        print(f"FAILED to complete ride: {res.text}")
        sys.exit(1)
    print(f"Ride completed. Status: {res.json()['status']}")

    print("\n--- PASSED: Full Flow Verified Successfully ---")

if __name__ == "__main__":
    verify_full_flow()
