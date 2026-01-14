import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def get_token(username, password):
    res = requests.post(f"{BASE_URL}/token/", data={"username": username, "password": password})
    if res.status_code == 200:
        return res.json()['access']
    return None

def debug_driver_view():
    print("--- Debugging Driver Ride Visibility ---")
    driver_token = get_token("driver1", "password123")
    if not driver_token:
        print("Failed to get driver token")
        return

    headers = {"Authorization": f"Bearer {driver_token}"}
    
    # 1. List all rides visible to driver
    print("\n[1] Fetching GET /rides/ as Driver...")
    res = requests.get(f"{BASE_URL}/rides/", headers=headers)
    rides = res.json()
    
    print(f"Driver sees {len(rides)} rides.")
    for r in rides:
        print(f" - Ride #{r['id']} Status: {r['status']}")
        
    # Check if any are 'completed'
    completed = [r for r in rides if r['status'] == 'completed']
    if completed:
        print(f"\n[!] WARNING: Driver sees {len(completed)} COMPLETED rides!")
    else:
        print("\n[OK] Driver does not see any completed rides.")

    # Check for active rides
    active = [r for r in rides if r['status'] in ['accepted', 'in_progress']]
    if active:
        print(f"\n[i] Driver has active rides: {[r['id'] for r in active]}")
    else:
        print("\n[i] Driver has NO active rides.")

if __name__ == "__main__":
    debug_driver_view()
