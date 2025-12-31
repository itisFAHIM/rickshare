import requests
import json

BASE_URL = "http://localhost:8000/api"

def run_test(name, func):
    print(f"\nTesting {name}...")
    try:
        func()
        print(f"   SUCCESS: {name} passed.")
    except Exception as e:
        print(f"   FAILED: {name} failed. Error: {e}")

def verify_auth_and_rides():
    # 1. Register Driver
    print("1. Registering Driver...")
    driver_data = {
        "username": "driver_test",
        "email": "driver@test.com",
        "password": "password123",
        "role": "driver"
    }
    # Try register (ignore if exists)
    try:
        requests.post(f"{BASE_URL}/users/register/", json=driver_data)
    except:
        pass

    # 2. Login Driver
    print("2. Logging in Driver...")
    res = requests.post(f"{BASE_URL}/token/", json={"username": "driver_test", "password": "password123"})
    if res.status_code != 200:
        raise Exception(f"Login failed: {res.text}")
    tokens = res.json()
    access_token = tokens['access']
    headers = {"Authorization": f"Bearer {access_token}"}
    print("   Token obtained.")

    # 3. Update Location
    print("3. Updating Location...")
    loc_data = {
        "latitude": 23.8103,
        "longitude": 90.4125,
        "vehicle_type": "car"
    }
    res = requests.post(f"{BASE_URL}/rides/drivers/", json=loc_data, headers=headers)
    if res.status_code != 200:
        raise Exception(f"Update location failed: {res.text}")
    print("   Location updated.")

    # 4. Get Locations
    print("4. Fetching Locations...")
    res = requests.get(f"{BASE_URL}/rides/drivers/", headers=headers)
    if res.status_code != 200:
        raise Exception(f"Fetch locations failed: {res.text}")
    drivers = res.json()
    print(f"   Found {len(drivers)} drivers.")
    if len(drivers) > 0:
        print(f"   First driver: {drivers[0]['username']} at {drivers[0]['latitude']}, {drivers[0]['longitude']}")

if __name__ == "__main__":
    try:
        verify_auth_and_rides()
    except Exception as e:
        print(f"\nCRITICAL FAILURE: {e}")
