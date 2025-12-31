from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DriverLocation, Ride
from .serializers import DriverLocationSerializer, RideSerializer
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
            # For MVP: Drivers see all REQUESTED rides + their own ACCEPTED/IN_PROGRESS rides
            return Ride.objects.filter(status='requested') | Ride.objects.filter(driver=user)
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
            
        ride.driver = user
        ride.status = 'accepted'
        ride.save()
        
        return Response(RideSerializer(ride).data)
