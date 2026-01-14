import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def get_token(username, password):
    try:
        res = requests.post(f"{BASE_URL}/token/", data={"username": username, "password": password})
        if res.status_code == 200:
            return res.json()['access']
        print(f"Failed to get token for {username}: {res.text}")
    except Exception as e:
        print(f"Error connecting to server: {e}")
    return None

def verify_bargain_flow():
    print("--- Starting Bargaining Verification ---")
    
    # 1. Setup
    print("[1] Getting tokens...")
    pax_token = get_token("verify_pax", "password123")
    driver_token = get_token("driver1", "password123")
    
    if not pax_token or not driver_token:
        print("Failed to get tokens. Ensure users verify_pax and driver1 exist.")
        sys.exit(1)

    pax_headers = {"Authorization": f"Bearer {pax_token}"}
    driver_headers = {"Authorization": f"Bearer {driver_token}"}

    # 2. Create Ride (Request)
    print("\n[2] Passenger requesting ride...")
    ride_data = {
        "pickup_latitude": 23.81, "pickup_longitude": 90.41, "pickup_address": "Bargain Pickup",
        "dropoff_latitude": 23.82, "dropoff_longitude": 90.42, "dropoff_address": "Bargain Dropoff"
    }
    res = requests.post(f"{BASE_URL}/rides/", json=ride_data, headers=pax_headers)
    if res.status_code != 201:
        print(f"Failed to create ride: {res.text}")
        sys.exit(1)
    
    ride_id = res.json()['id']
    est_fare = res.json()['estimated_fare']
    print(f"Ride #{ride_id} created. Estimated Fare: {est_fare}")

    # 3. Driver Places Bid
    print("\n[3] Driver placing bid...")
    bid_amount = float(est_fare) - 10.0 # Bidding lower than estimate
    res = requests.post(f"{BASE_URL}/rides/{ride_id}/bid/", json={"amount": bid_amount}, headers=driver_headers)
    if res.status_code != 201:
        print(f"Failed to place bid: {res.text}")
        sys.exit(1)
    
    bid_data = res.json()
    bid_id = bid_data['id']
    print(f"Bid #{bid_id} placed: {bid_data['amount']} (Status: {bid_data['status']})")

    # 4. Passenger checks ride details (should see bids)
    print("\n[4] Passenger checking ride details...")
    res = requests.get(f"{BASE_URL}/rides/{ride_id}/", headers=pax_headers)
    ride_details = res.json()
    bids = ride_details.get('bids', [])
    print(f"Passenger sees {len(bids)} bids.")
    
    found_bid = next((b for b in bids if b['id'] == bid_id), None)
    if not found_bid:
        print("Test failed: Passenger does not see the driver's bid.")
        sys.exit(1)
    print("Passenger sees the bid correctly.")

    # 5. Passenger Accepts Bid
    print("\n[5] Passenger accepting bid...")
    res = requests.post(f"{BASE_URL}/rides/{ride_id}/accept_bid/", json={"bid_id": bid_id}, headers=pax_headers)
    if res.status_code != 200:
        print(f"Failed to accept bid: {res.text}")
        sys.exit(1)
    
    updated_ride = res.json()
    print(f"Bid accepted. Ride Status: {updated_ride['status']}")
    print(f"Actual Fare: {updated_ride['actual_fare']}")
    print(f"Driver: {updated_ride['driver']}")

    if updated_ride['status'] == 'accepted' and float(updated_ride['actual_fare']) == bid_amount:
        print("\n--- PASSED: Bargaining Flow Verified Successfully ---")
    else:
        print("\n--- FAILED: Ride state incorrect after accepting bid ---")

if __name__ == "__main__":
    verify_bargain_flow()
