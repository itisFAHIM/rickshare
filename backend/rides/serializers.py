from rest_framework import serializers
from .models import DriverLocation, Ride, Message

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'created_at']


class DriverLocationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = DriverLocation
        fields = ['username', 'latitude', 'longitude', 'vehicle_type', 'updated_at']

class RideSerializer(serializers.ModelSerializer):
    passenger = serializers.StringRelatedField(read_only=True)
    driver = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Ride
        fields = '__all__'
        read_only_fields = ('passenger', 'driver', 'status', 'created_at', 'updated_at')

    def create(self, validated_data):
        # Assign current user as passenger
        validated_data['passenger'] = self.context['request'].user
        return super().create(validated_data)
