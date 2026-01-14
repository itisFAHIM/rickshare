import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rides.models import Ride

def cleanup_stale_rides():
    # Find all accepted/in_progress rides
    active_rides = Ride.objects.filter(status__in=['accepted', 'in_progress'])
    print(f"Found {active_rides.count()} active rides.")
    
    for ride in active_rides:
        print(f"Cancelling stale ride #{ride.id} (Driver: {ride.driver}, Passenger: {ride.passenger})")
        ride.status = 'cancelled'
        ride.save()

    print("Cleanup complete.")

if __name__ == "__main__":
    cleanup_stale_rides()
