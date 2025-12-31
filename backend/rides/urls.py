from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DriverLocationView, RideViewSet

router = DefaultRouter()
router.register(r'', RideViewSet, basename='ride')

urlpatterns = [
    path('drivers/', DriverLocationView.as_view(), name='driver-locations'),
    path('', include(router.urls)),
]
