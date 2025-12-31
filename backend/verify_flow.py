import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

def get_token(username, password):
    res = requests.post(f"{BASE_URL}/token/", data={"username": username, "password": password})
    if res.status_code == 200:
        return res.json()['access']
    print(f"Failed to login {username}: {res.text}")
    return None

def create_user(username, email, password, role='rider'):
    # Try login first to see if exists
    token = get_token(username, password)
    if token:
        return token
    
    # Register
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

def verify_flow():
    print("--- Starting Verification ---")
    
    # 1. Setup Riders
    passenger_token = create_user("test_rider", "rider@test.com", "password123", "rider")
    driver_token = get_token("driver1", "password123") # Created earlier
    
    if not passenger_token or not driver_token:
        print("Failed to get tokens.")
        return

    passenger_headers = {"Authorization": f"Bearer {passenger_token}"}
    driver_headers = {"Authorization": f"Bearer {driver_token}"}

    # 2. Passenger Requests Ride
    print("\n[Passenger] Requesting Ride...")
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
        print(f"Failed to create ride: {res.text}")
        return
    ride = res.json()
    ride_id = ride['id']
    print(f"Ride #{ride_id} created. Status: {ride['status']}")

    # 3. Driver Lists Rides
    print("\n[Driver] Listing Rides...")
    res = requests.get(f"{BASE_URL}/rides/", headers=driver_headers)
    rides = res.json()
    target_ride = next((r for r in rides if r['id'] == ride_id), None)
    
    if target_ride:
        print(f"Found Ride #{ride_id} in driver list.")
    else:
        print(f"Ride #{ride_id} NOT found in driver list. (Status={ride['status']})")
        return

    # 4. Driver Accepts Ride
    print(f"\n[Driver] Accepting Ride #{ride_id}...")
    res = requests.patch(f"{BASE_URL}/rides/{ride_id}/accept/", headers=driver_headers)
    if res.status_code == 200:
        updated_ride = res.json()
        print(f"Ride accepted. New Status: {updated_ride['status']}")
        print(f"Driver Assigned: {updated_ride['driver']}")
    else:
        print(f"Failed to accept ride: {res.text}")

    # 5. Cleanup (Cancel ride so it doesn't clutter)
    # Optional logic, but backend doesn't support cancel yet via simple API for clean up in script, skipping.
    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    verify_flow()
