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

def verify_chat_flow():
    print("--- Starting Chat Verification ---")
    
    # 1. Setup
    print("[1] Getting tokens...")
    passenger_token = get_token("verify_pax", "password123")
    driver_token = get_token("driver1", "password123")
    
    if not passenger_token or not driver_token:
        print("Failed to get tokens. Please run verify_full_flow.py first to setup users.")
        sys.exit(1)

    passenger_headers = {"Authorization": f"Bearer {passenger_token}"}
    driver_headers = {"Authorization": f"Bearer {driver_token}"}

    # 2. Get the latest active ride for the passenger (to ensure ownership)
    print("\n[2] Finding active ride for passenger...")
    res = requests.get(f"{BASE_URL}/rides/", headers=passenger_headers)
    rides = res.json()
    active_ride = next((r for r in rides if r['status'] in ['accepted', 'in_progress']), None)
    
    if not active_ride:
        print("No active ride found for passenger. Please create/accept a ride first.")
        sys.exit(1)
        
    ride_id = active_ride['id']
    print(f"Found Ride #{ride_id} (Status: {active_ride['status']})")

    # 3. Passenger sends message
    print("\n[3] Passenger sending message...")
    msg_content = "Hello Driver, where are you?"
    res = requests.post(f"{BASE_URL}/rides/{ride_id}/messages/", json={"content": msg_content}, headers=passenger_headers)
    if res.status_code != 201:
        print(f"FAILED to send message: {res.text}")
        sys.exit(1)
    print("Passenger message sent.")

    # 4. Driver checks messages
    print("\n[4] Driver checking messages...")
    res = requests.get(f"{BASE_URL}/rides/{ride_id}/messages/", headers=driver_headers)
    messages = res.json()
    last_msg = messages[-1] if messages else None
    
    if last_msg and last_msg['content'] == msg_content:
        print(f"Driver received: '{last_msg['content']}' from {last_msg['sender']}")
    else:
        print("Driver did NOT receive the message correctly.")
        print(f"Messages found: {messages}")
        sys.exit(1)

    # 5. Driver replies
    print("\n[5] Driver replying...")
    reply_content = "I am arriving in 5 minutes."
    res = requests.post(f"{BASE_URL}/rides/{ride_id}/messages/", json={"content": reply_content}, headers=driver_headers)
    if res.status_code != 201:
        print(f"FAILED to send reply: {res.text}")
        sys.exit(1)
    print("Driver reply sent.")

    # 6. Passenger checks messages
    print("\n[6] Passenger checking messages...")
    res = requests.get(f"{BASE_URL}/rides/{ride_id}/messages/", headers=passenger_headers)
    messages = res.json()
    last_msg = messages[-1] if messages else None
    
    if last_msg and last_msg['content'] == reply_content:
        print(f"Passenger received: '{last_msg['content']}' from {last_msg['sender']}")
    else:
        print("Passenger did NOT receive the reply correctly.")
        print(f"Messages found: {messages}")
        sys.exit(1)

    print("\n--- PASSED: Chat Flow Verified Successfully ---")

if __name__ == "__main__":
    verify_chat_flow()
