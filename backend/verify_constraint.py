import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def get_token(username, password):
    res = requests.post(f"{BASE_URL}/token/", data={"username": username, "password": password})
    if res.status_code == 200:
        return res.json()['access']
    return None

def verify_single_active_ride():
    print("--- Verifying Single Active Ride Constraint ---")
    driver_token = get_token("driver1", "password123")
    pax_token = get_token("verify_pax", "password123")
    
    if not driver_token or not pax_token:
        print("Failed to get tokens.")
        return

    headers = {"Authorization": f"Bearer {driver_token}"}
    pax_headers = {"Authorization": f"Bearer {pax_token}"}

    # 1. Ensure clean slate (using existing helper logic or assumption)
    # Ideally we should cancel any active rides first, but we ran cleanup previously.

    # 2. Create Ride 1
    print("\n[1] Creating Ride 1...")
    r1_data = {
        "pickup_latitude": 23.81, "pickup_longitude": 90.41, "pickup_address": "A",
        "dropoff_latitude": 23.82, "dropoff_longitude": 90.42, "dropoff_address": "B"
    }
    r1 = requests.post(f"{BASE_URL}/rides/", json=r1_data, headers=pax_headers).json()
    print(f"Ride #{r1['id']} created.")

    # 3. Accept Ride 1
    print("[2] Accepting Ride 1...")
    res = requests.patch(f"{BASE_URL}/rides/{r1['id']}/accept/", headers=headers)
    if res.status_code == 200:
        print(f"Ride #{r1['id']} accepted.")
    else:
        print(f"Failed to accept Ride 1: {res.text}")
        return

    # 4. Create Ride 2
    print("\n[3] Creating Ride 2...")
    r2_data = {
        "pickup_latitude": 23.83, "pickup_longitude": 90.43, "pickup_address": "C",
        "dropoff_latitude": 23.84, "dropoff_longitude": 90.44, "dropoff_address": "D"
    }
    r2 = requests.post(f"{BASE_URL}/rides/", json=r2_data, headers=pax_headers).json()
    print(f"Ride #{r2['id']} created.")

    # 5. Attempt to Accept Ride 2 (Should Fail)
    print("[4] Attempting to Accept Ride 2 (Should Fail)...")
    res = requests.patch(f"{BASE_URL}/rides/{r2['id']}/accept/", headers=headers)
    if res.status_code == 400 and "already have an active ride" in res.text:
        print("SUCCESS: Rejected simultaneous ride acceptance.")
    else:
        print(f"FAILURE: Unexpected response: {res.status_code} {res.text}")
        return
        
    # 6. Complete Ride 1
    print("\n[5] Completing Ride 1...")
    requests.post(f"{BASE_URL}/rides/{r1['id']}/start_ride/", headers=headers)
    requests.post(f"{BASE_URL}/rides/{r1['id']}/complete_ride/", headers=headers)
    print(f"Ride #{r1['id']} completed.")
    
    # 7. Attempt to Accept Ride 2 (Should Succeed now)
    print("[6] Attempting to Accept Ride 2 (Should Succeed)...")
    res = requests.patch(f"{BASE_URL}/rides/{r2['id']}/accept/", headers=headers)
    if res.status_code == 200:
        print("SUCCESS: Accepted new ride after completion.")
    else:
        print(f"FAILURE: Could not accept new ride: {res.text}")

    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    verify_single_active_ride()
