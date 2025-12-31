"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../lib/api";

// Fix for default Leaflet icon issues in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png', // Placeholder Car
    iconSize: [32, 32],
});

const bikeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3082/3082383.png', // Placeholder Bike
    iconSize: [32, 32],
});

const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];

interface DriverLocation {
    username: string;
    latitude: number;
    longitude: number;
    vehicle_type: string;
}

// Component to recenter map when location changes
import { useMap } from "react-leaflet";
function RecenterMap({ location }: { location: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(location, 15);
    }, [location, map]);
    return null;
}

export default function Map() {
    const [drivers, setDrivers] = useState<DriverLocation[]>([]);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch Drivers
        const fetchDrivers = async () => {
            try {
                const res = await api.get("/rides/drivers/");
                setDrivers(res.data);
            } catch (err) {
                console.error("Failed to fetch drivers", err);
            }
        };

        fetchDrivers();
        const interval = setInterval(fetchDrivers, 5000); // Poll every 5s

        // Fetch User Location
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by this browser.");
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation([latitude, longitude]);
                    setLocationError(null);
                },
                (error) => {
                    console.error("Error getting location:", error.message);
                    let msg = "Unknown error getting location.";
                    if (error.code === 1) msg = "Location permission denied. Please enable location services.";
                    else if (error.code === 2) msg = "Location unavailable. Ensure GPS is on.";
                    else if (error.code === 3) msg = "Location request timed out.";

                    if (window.isSecureContext === false) {
                        msg += " (Geolocation requires HTTPS or localhost)";
                    }
                    setLocationError(msg);
                },
                { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 }
            );
        }

        return () => clearInterval(interval);
    }, []);

    // Helper icon for user
    const userIcon = new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/9131/9131546.png', // Placeholder User Person
        iconSize: [40, 40],
    });

    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative z-0">
            <MapContainer
                center={userLocation || DHAKA_CENTER}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Error Overlay */}
                {locationError && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold animate-pulse whitespace-nowrap">
                        {locationError}
                    </div>
                )}

                {/* Loading User Location */}
                {!userLocation && !locationError && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold animate-pulse whitespace-nowrap">
                        Locating you...
                    </div>
                )}

                {/* Recenter map if user location is found */}
                {userLocation && <RecenterMap location={userLocation} />}

                {/* User Marker */}
                {userLocation && (
                    <Marker position={userLocation} icon={userIcon}>
                        <Popup>You are here</Popup>
                    </Marker>
                )}

                {/* Driver Markers */}
                {drivers.map((driver, idx) => (
                    <Marker
                        key={idx}
                        position={[driver.latitude, driver.longitude]}
                        icon={driver.vehicle_type === 'bike' ? bikeIcon : carIcon}
                    >
                        <Popup>
                            <div className="text-black">
                                <strong>{driver.username}</strong><br />
                                {driver.vehicle_type}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
