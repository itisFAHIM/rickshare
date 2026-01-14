import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def get_token(username, password):
    try:
        res = requests.post(f"{BASE_URL}/token/", data={"username": username, "password": password})
        if res.status_code == 200:
            return res.json()['access']
    except:
        pass
    return None

def complete_active_ride():
    print("--- Completing Active Ride ---")
    driver_token = get_token("driver1", "password123")
    
    if not driver_token:
        print("Failed to get driver token.")
        return

    headers = {"Authorization": f"Bearer {driver_token}"}

    # Get active rides
    res = requests.get(f"{BASE_URL}/rides/", headers=headers)
    rides = res.json()
    active_ride = next((r for r in rides if r['status'] in ['accepted', 'in_progress']), None)

    if not active_ride:
        print("No active ride found to complete.")
        return

    ride_id = active_ride['id']
    print(f"Found Active Ride #{ride_id}. Status: {active_ride['status']}")

    # 1. Start Ride (if not already started)
    if active_ride['status'] == 'accepted':
        print("Starting ride...")
        res = requests.post(f"{BASE_URL}/rides/{ride_id}/start_ride/", headers=headers)
        if res.status_code == 200:
            print(f"Ride #{ride_id} started.")
        else:
            print(f"Failed to start ride: {res.text}")
            return

    # 2. Complete Ride
    print("Completing ride...")
    res = requests.post(f"{BASE_URL}/rides/{ride_id}/complete_ride/", headers=headers)
    
    if res.status_code == 200:
         print(f"Ride #{ride_id} status updated to 'completed'.")
    else:
        print(f"Failed to complete ride. Status: {res.status_code} {res.text}")

if __name__ == "__main__":
    complete_active_ride()
