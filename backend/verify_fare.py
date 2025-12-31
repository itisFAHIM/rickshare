import requests
import time

BASE_URL = "http://127.0.0.1:8000/api"

def get_token(username, password):
    res = requests.post(f"{BASE_URL}/token/", data={"username": username, "password": password})
    if res.status_code == 200:
        return res.json()['access']
    return None

def verify_fare_system():
    print("--- Starting Fare System Verification ---")
    
    # 1. Setup Users
    rider_token = get_token("test_rider", "password123")
    driver1_token = get_token("driver1", "password123")
    # Need a second driver to test disappearance
    requests.post(f"{BASE_URL}/users/register/", data={"username": "driver2", "email": "d2@test.com", "password": "password123", "role": "driver"})
    driver2_token = get_token("driver2", "password123")

    if not all([rider_token, driver1_token, driver2_token]):
        print("Failed to get tokens.")
        return

    rider_headers = {"Authorization": f"Bearer {rider_token}"}
    d1_headers = {"Authorization": f"Bearer {driver1_token}"}
    d2_headers = {"Authorization": f"Bearer {driver2_token}"}

    # 2. Estimate Fare
    print("\n[Rider] Getting Estimate...")
    est_data = {
        "pickup_latitude": 23.8103,
        "pickup_longitude": 90.4125,
        "dropoff_latitude": 23.8203,
        "dropoff_longitude": 90.4225
    }
    res = requests.post(f"{BASE_URL}/rides/estimate/", json=est_data, headers=rider_headers)
    estimate = res.json()
    print(f"Estimate: BDT {estimate.get('estimated_fare')} ({estimate.get('distance_km')} km)")

    # 3. Request Ride (Simulating Confirm)
    print("\n[Rider] Requesting Ride...")
    ride_data = {
        "pickup_address": "Gulshan",
        "dropoff_address": "Banani",
        **est_data
    }
    res = requests.post(f"{BASE_URL}/rides/", json=ride_data, headers=rider_headers)
    ride = res.json()
    ride_id = ride['id']
    print(f"Ride #{ride_id} Requested. Fare Saved: {ride.get('estimated_fare')}")

    # 4. Verify Both Drivers See It
    print("\n[Driver 1] Checking requests...")
    res = requests.get(f"{BASE_URL}/rides/", headers=d1_headers)
    d1_sees = any(r['id'] == ride_id for r in res.json())
    print(f"Driver 1 sees ride? {d1_sees}")

    print("[Driver 2] Checking requests...")
    res = requests.get(f"{BASE_URL}/rides/", headers=d2_headers)
    d2_sees = any(r['id'] == ride_id for r in res.json())
    print(f"Driver 2 sees ride? {d2_sees}")

    # 5. Driver 1 Accepts
    print(f"\n[Driver 1] Accepting Ride #{ride_id}...")
    res = requests.patch(f"{BASE_URL}/rides/{ride_id}/accept/", headers=d1_headers)
    if res.status_code == 200:
        print("Ride Accepted.")
    else:
        print(f"Accept failed: {res.text}")

    # 6. Verify Driver 2 CANNOT see it anymore
    print("\n[Driver 2] Checking requests again...")
    res = requests.get(f"{BASE_URL}/rides/", headers=d2_headers)
    d2_sees_now = any(r['id'] == ride_id for r in res.json())
    print(f"Driver 2 sees ride now? {d2_sees_now}")

    if not d2_sees_now:
        print("SUCCESS: Ride disappeared for other drivers.")
    else:
        print("FAILURE: Ride still visible to other drivers.")

if __name__ == "__main__":
    verify_fare_system()
