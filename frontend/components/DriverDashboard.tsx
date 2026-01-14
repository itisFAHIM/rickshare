"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import api from "../lib/api";
import ChatWindow from "./ChatWindow";

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import("./Map"), { ssr: false });

export default function DriverDashboard() {
    const [isOnline, setIsOnline] = useState(false);
    const [simulateLocation, setSimulateLocation] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [requestedRides, setRequestedRides] = useState<any[]>([]);
    const [activeRide, setActiveRide] = useState<any>(null);

    const fetchRides = async () => {
        try {
            const res = await api.get("/rides/");
            const allRides = res.data;

            // Separate active ride from requests
            const active = allRides.find((r: any) => r.status === 'accepted' || r.status === 'in_progress');
            const requests = allRides.filter((r: any) => r.status === 'requested');

            setActiveRide(active || null);
            setRequestedRides(requests);

        } catch (err) {
            console.error("Failed to fetch rides", err);
        }
    };

    useEffect(() => {
        const interval = setInterval(fetchRides, 5000);
        fetchRides();

        return () => clearInterval(interval);
    }, []);

    const handleAcceptRide = async (rideId: number) => {
        try {
            await api.patch(`/rides/${rideId}/accept/`);
            setStatusMessage(`Ride #${rideId} accepted!`);
            fetchRides();
        } catch (err) {
            console.error("Failed to accept ride", err);
            setStatusMessage("Failed to accept ride.");
        }
    };

    const handleStartRide = async () => {
        if (!activeRide) return;
        try {
            await api.post(`/rides/${activeRide.id}/start_ride/`);
            setStatusMessage("Ride started!");
            fetchRides();
        } catch (err) {
            console.error("Failed to start ride", err);
            setStatusMessage("Failed to start ride.");
        }
    };

    const handleCompleteRide = async () => {
        if (!activeRide) return;
        try {
            await api.post(`/rides/${activeRide.id}/complete_ride/`);
            setStatusMessage("Ride completed!");
            setActiveRide(null); // Clear active ride locally immediately
            fetchRides();
        } catch (err) {
            console.error("Failed to complete ride", err);
            setStatusMessage("Failed to complete ride.");
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isOnline) {
            const updateLocation = () => {
                if (simulateLocation) {
                    // Simulate random movement around Dhaka
                    const lat = 23.8103 + (Math.random() - 0.5) * 0.01;
                    const lng = 90.4125 + (Math.random() - 0.5) * 0.01;

                    api.post("/rides/drivers/", {
                        latitude: lat,
                        longitude: lng,
                        vehicle_type: "car",
                    }).then(() => {
                        setStatusMessage("Location updated (Simulated).");
                    }).catch(err => {
                        console.error("Failed to update simulated location", err);
                        setStatusMessage("Failed to update location.");
                    });
                } else if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const { latitude, longitude } = position.coords;
                            try {
                                await api.post("/rides/drivers/", {
                                    latitude,
                                    longitude,
                                    vehicle_type: "car", // Hardcoded for now, could be from user profile
                                });
                                statusMessage === "Location updated." || setStatusMessage("Location updated.");
                            } catch (error) {
                                console.error("Failed to update location", error);
                                setStatusMessage("Failed to update location.");
                            }
                        },
                        (error) => {
                            console.error("Geolocation error:", error.message);
                            let msg = "Geolocation error.";
                            if (error.code === 1) msg = "Location permission denied.";
                            else if (error.code === 2) msg = "Location unavailable. GPS off?";
                            else if (error.code === 3) msg = "Location timed out.";
                            setStatusMessage(msg);
                        },
                        { enableHighAccuracy: false, timeout: 20000 }
                    );
                } else {
                    setStatusMessage("Geolocation not supported.");
                }
            };

            updateLocation(); // Immediate update
            interval = setInterval(updateLocation, 5000); // Poll every 5s
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOnline, simulateLocation]);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Driver Controls */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                        <h2 className="text-2xl font-bold mb-4">Driver Status</h2>
                        <div className="flex items-center space-x-4 mb-6">
                            <div className={`w-4 h-4 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-lg font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                        </div>

                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`w-full py-4 rounded-lg text-white font-bold text-lg transition-colors ${isOnline
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {isOnline ? 'Go Offline' : 'Go Online'}
                        </button>

                        <div className="mt-4 flex items-center">
                            <input
                                type="checkbox"
                                id="simulate"
                                checked={simulateLocation}
                                onChange={(e) => setSimulateLocation(e.target.checked)}
                                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                            />
                            <label htmlFor="simulate" className="ml-2 block text-sm text-gray-900">
                                Simulate Location (Dev Mode)
                            </label>
                        </div>

                        {statusMessage && (
                            <p className="mt-4 text-sm text-gray-500">{statusMessage}</p>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                        <h3 className="font-semibold mb-2">Earnings Today</h3>
                        <p className="text-3xl font-bold text-green-600">$0.00</p>
                    </div>

                    {/* Active Ride Card */}
                    {activeRide && (
                        <div className="bg-white p-6 rounded-xl border-2 border-green-500 shadow-lg animate-fade-in">
                            <h3 className="font-bold text-xl mb-4 text-green-700">Current Ride</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-500">Passenger</span>
                                    <span className="text-sm font-bold">{activeRide.passenger}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-500">Status</span>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold uppercase">
                                        {activeRide.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="border-t border-gray-100 pt-2">
                                    <p className="text-sm text-gray-500">Pickup</p>
                                    <p className="font-medium text-gray-900">{activeRide.pickup_address}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Dropoff</p>
                                    <p className="font-medium text-gray-900">{activeRide.dropoff_address}</p>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500">Fare</span>
                                    <span className="text-xl font-bold text-black">BDT {activeRide.estimated_fare}</span>
                                </div>
                            </div>

                            {activeRide.status === 'accepted' && (
                                <button
                                    onClick={handleStartRide}
                                    className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                                >
                                    Start Ride
                                </button>
                            )}

                            {activeRide.status === 'in_progress' && (
                                <button
                                    onClick={handleCompleteRide}
                                    className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition"
                                >
                                    Complete Ride
                                </button>
                            )}
                        </div>
                    )}

                    {/* Active Ride Chat */}
                    {activeRide && (
                        <div className="mt-6">
                            <ChatWindow rideId={activeRide.id} currentUserRole="driver" currentUsername={activeRide.driver} />
                        </div>
                    )}

                    {/* Ride Requests List */}
                    {!activeRide && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200">
                            <h3 className="font-semibold mb-4">Ride Requests ({requestedRides.length})</h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {requestedRides.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No new requests.</p>
                                ) : (
                                    requestedRides.map((ride) => (
                                        <div key={ride.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-sm">Ride #{ride.id}</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-1">
                                                        {ride.status}
                                                    </span>
                                                    {ride.estimated_fare && (
                                                        <span className="text-green-600 font-bold text-sm">
                                                            BDT {ride.estimated_fare}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-1">
                                                <span className="font-medium">Pickup:</span> {ride.pickup_address}
                                            </p>
                                            <p className="text-sm text-gray-600 mb-1">
                                                <span className="font-medium">Dropoff:</span> {ride.dropoff_address}
                                            </p>
                                            {ride.distance_km && (
                                                <p className="text-xs text-gray-500 mb-3">
                                                    Distance: {ride.distance_km} km ({ride.duration_minutes} min)
                                                </p>
                                            )}
                                            <button
                                                onClick={() => handleAcceptRide(ride.id)}
                                                className="w-full py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition"
                                            >
                                                Accept Ride
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Map Area */}
                <div className="col-span-1 md:col-span-2 relative h-[600px] w-full bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                    <Map />
                </div>
            </div>
        </main>
    );
}
