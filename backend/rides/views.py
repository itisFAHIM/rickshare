from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DriverLocation, Ride, Message, RideBid
from .serializers import DriverLocationSerializer, RideSerializer, MessageSerializer, RideBidSerializer
from .services import calculate_fare

class DriverLocationView(generics.ListCreateAPIView):
    queryset = DriverLocation.objects.all()
    serializer_class = DriverLocationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Return all locations
        return DriverLocation.objects.all()

    def post(self, request, *args, **kwargs):
        # Update or create location for the logged-in user
        user = request.user
        if user.role != 'driver':
             return Response({"error": "Only drivers can update location"}, status=status.HTTP_403_FORBIDDEN)
             
        data = request.data
        location, created = DriverLocation.objects.update_or_create(
            user=user,
            defaults={
                'latitude': data.get('latitude'),
                'longitude': data.get('longitude'),
                'vehicle_type': data.get('vehicle_type', 'car')
            }
        )
        return Response(DriverLocationSerializer(location).data, status=status.HTTP_200_OK)

class RideViewSet(viewsets.ModelViewSet):
    queryset = Ride.objects.all()
    serializer_class = RideSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'driver':
            # Drivers see available requests or rides they effectively own (accepted/in-progress)
            # Drivers see available requests OR rides they have accepted/started
            return Ride.objects.filter(status='requested') | Ride.objects.filter(driver=user, status__in=['accepted', 'in_progress'])
        else:
            # Passengers only see their own rides
            return Ride.objects.filter(passenger=user)

    def perform_create(self, serializer):
        # Calculate fare before saving
        data = self.request.data
        pickup_lat = float(data.get('pickup_latitude'))
        pickup_lon = float(data.get('pickup_longitude'))
        dropoff_lat = float(data.get('dropoff_latitude'))
        dropoff_lon = float(data.get('dropoff_longitude'))
        
        fare_details = calculate_fare(pickup_lat, pickup_lon, dropoff_lat, dropoff_lon)
        
        serializer.save(
            passenger=self.request.user,
            estimated_fare=fare_details['estimated_fare'],
            distance_km=fare_details['distance_km'],
            duration_minutes=fare_details['duration_minutes'],
            traffic_factor=fare_details['traffic_factor']
        )

    @action(detail=False, methods=['post'])
    def estimate(self, request):
        try:
            data = request.data
            pickup_lat = float(data.get('pickup_latitude'))
            pickup_lon = float(data.get('pickup_longitude'))
            dropoff_lat = float(data.get('dropoff_latitude'))
            dropoff_lon = float(data.get('dropoff_longitude'))
            
            fare_details = calculate_fare(pickup_lat, pickup_lon, dropoff_lat, dropoff_lon)
            return Response(fare_details)
        except (TypeError, ValueError):
            return Response({"error": "Invalid coordinates"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def accept(self, request, pk=None):
        ride = self.get_object()
        user = request.user
        
        if user.role != 'driver':
            return Response({"error": "Only drivers can accept rides"}, status=status.HTTP_403_FORBIDDEN)
            
        if ride.status != 'requested':
            return Response({"error": "Ride is not available"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if driver already has an active ride
        active_rides = Ride.objects.filter(driver=user, status__in=['accepted', 'in_progress'])
        if active_rides.exists():
            return Response({"error": "You already have an active ride"}, status=status.HTTP_400_BAD_REQUEST)

        ride.driver = user
        ride.status = 'accepted'
        ride.save()
        
        return Response(RideSerializer(ride).data)

    @action(detail=True, methods=['post'])
    def bid(self, request, pk=None):
        ride = self.get_object()
        user = request.user

        if user.role != 'driver':
            return Response({"error": "Only drivers can bid"}, status=status.HTTP_403_FORBIDDEN)
        
        if ride.status != 'requested':
            return Response({"error": "Ride is not available for bidding"}, status=status.HTTP_400_BAD_REQUEST)
            
        amount = request.data.get('amount')
        if not amount:
             return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)

        bid, created = RideBid.objects.update_or_create(
            ride=ride,
            driver=user,
            defaults={'amount': amount, 'status': 'pending'}
        )
        
        return Response(RideBidSerializer(bid).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept_bid(self, request, pk=None):
        ride = self.get_object()
        user = request.user

        if ride.passenger != user:
            return Response({"error": "Only the passenger can accept bids"}, status=status.HTTP_403_FORBIDDEN)
            
        bid_id = request.data.get('bid_id')
        try:
            bid = RideBid.objects.get(id=bid_id, ride=ride)
        except RideBid.DoesNotExist:
            return Response({"error": "Bid not found"}, status=status.HTTP_404_NOT_FOUND)

        # Update Ride
        ride.driver = bid.driver
        ride.status = 'accepted'
        ride.actual_fare = bid.amount
        ride.save()

        # Update Bids
        bid.status = 'accepted'
        bid.save()
        
        # Reject other bids (optional, but good practice)
        RideBid.objects.filter(ride=ride).exclude(id=bid.id).update(status='rejected')

        return Response(RideSerializer(ride).data)

    @action(detail=True, methods=['post'])
    def start_ride(self, request, pk=None):
        ride = self.get_object()
        user = request.user
        
        if user.role != 'driver':
            return Response({"error": "Only drivers can start rides"}, status=status.HTTP_403_FORBIDDEN)
            
        if ride.driver != user:
             return Response({"error": "You are not the driver for this ride"}, status=status.HTTP_403_FORBIDDEN)
             
        if ride.status != 'accepted':
            return Response({"error": "Ride must be accepted before starting"}, status=status.HTTP_400_BAD_REQUEST)
            
        ride.status = 'in_progress'
        ride.save()
        
        return Response(RideSerializer(ride).data)

    @action(detail=True, methods=['post'])
    def complete_ride(self, request, pk=None):
        ride = self.get_object()
        user = request.user
        
        if user.role != 'driver':
            return Response({"error": "Only drivers can complete rides"}, status=status.HTTP_403_FORBIDDEN)
            
        if ride.driver != user:
             return Response({"error": "You are not the driver for this ride"}, status=status.HTTP_403_FORBIDDEN)
             
        if ride.status != 'in_progress':
            return Response({"error": "Ride must be in progress before completing"}, status=status.HTTP_400_BAD_REQUEST)
            
        ride.status = 'completed'
        ride.save()
        
        return Response(RideSerializer(ride).data)

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        ride = self.get_object()
        user = request.user
        
        # Security check: Only participant can view/send
        if user != ride.passenger and user != ride.driver:
            return Response({"error": "Not a participant"}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'GET':
            messages = ride.messages.all()
            return Response(MessageSerializer(messages, many=True).data)
        
        elif request.method == 'POST':
            content = request.data.get('content')
            if not content:
                return Response({"error": "Content required"}, status=status.HTTP_400_BAD_REQUEST)
                
            message = Message.objects.create(ride=ride, sender=user, content=content)
            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
