"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import api from "../lib/api";

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import("./Map"), { ssr: false });

export default function PassengerDashboard() {
    const [pickup, setPickup] = useState("");
    const [dropoff, setDropoff] = useState("");
    const [status, setStatus] = useState<"idle" | "estimating" | "estimated" | "requesting" | "requested" | "accepted">("idle");
    const [currentRide, setCurrentRide] = useState<any>(null);
    const [estimate, setEstimate] = useState<any>(null);

    const checkRideStatus = async (rideId: number) => {
        try {
            const res = await api.get(`/rides/${rideId}/`);
            if (res.data.status === 'accepted') {
                setStatus('accepted');
                setCurrentRide(res.data);
            }
        } catch (err) {
            console.error("Error checking ride status", err);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'requested' && currentRide) {
            interval = setInterval(() => {
                checkRideStatus(currentRide.id);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [status, currentRide]);

    const handleGetEstimate = async () => {
        if (!pickup || !dropoff) return;
        setStatus("estimating");
        try {
            const res = await api.post("/rides/estimate/", {
                pickup_address: pickup,
                dropoff_address: dropoff,
                pickup_latitude: 23.8103, // Mock
                pickup_longitude: 90.4125,
                dropoff_latitude: 23.8103 + 0.01,
                dropoff_longitude: 90.4125 + 0.01
            });
            setEstimate(res.data);
            setStatus("estimated");
        } catch (error) {
            console.error("Failed to get estimate", error);
            setStatus("idle");
            alert("Failed to get estimate. Please try again.");
        }
    };

    const handleRequestRide = async () => {
        if (!pickup || !dropoff) return;
        setStatus("requesting");

        try {
            const res = await api.post("/rides/", {
                pickup_address: pickup,
                dropoff_address: dropoff,
                pickup_latitude: 23.8103,
                pickup_longitude: 90.4125,
                dropoff_latitude: 23.8103 + 0.01,
                dropoff_longitude: 90.4125 + 0.01
            });
            setCurrentRide(res.data);
            setStatus("requested");
        } catch (error) {
            console.error("Failed to request ride", error);
            setStatus("idle");
            alert("Failed to request ride. Please try again.");
        }
    };

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">

                {/* Left Column: Content */}
                <div className="mb-12 lg:mb-0">
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-black mb-8 leading-tight">
                        {status === 'idle' || status === 'estimating' || status === 'estimated' ? "Go anywhere with RickShare" : "Ride in progress"}
                    </h1>

                    {/* Input Form */}
                    {(status === 'idle' || status === 'estimating' || status === 'estimated') && (
                        <div className="bg-white p-0 md:p-1 max-w-md w-full">
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <div className="w-2 h-2 bg-black rounded-full"></div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Pickup location"
                                        value={pickup}
                                        onChange={(e) => setPickup(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border-none rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <div className="w-2 h-2 bg-black border-2 border-black bg-white"></div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Dropoff location"
                                        value={dropoff}
                                        onChange={(e) => setDropoff(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border-none rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>

                                {/* Estimate View */}
                                {status === 'estimated' && estimate && (
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-lg font-bold text-black">RickShare Saver</span>
                                            <span className="text-xl font-bold text-black">BDT {estimate.estimated_fare}</span>
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <span>{estimate.distance_km} km</span>
                                            <span>•</span>
                                            <span>{estimate.duration_minutes} min</span>
                                        </div>
                                        <div className="mt-2 text-xs">
                                            Traffic:
                                            <span className={`ml-1 font-bold ${estimate.traffic_status === 'Heavy' ? 'text-red-600' : 'text-green-600'}`}>
                                                {estimate.traffic_status}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {status === 'idle' || status === 'estimating' ? (
                                    <button
                                        onClick={handleGetEstimate}
                                        disabled={!pickup || !dropoff || status === 'estimating'}
                                        className="w-fit px-8 py-3 bg-black text-white text-lg font-medium rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status === 'estimating' ? 'Calculating...' : 'See prices'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRequestRide}
                                        className="w-full px-8 py-3 bg-black text-white text-lg font-bold rounded-lg hover:bg-gray-900 transition-colors"
                                    >
                                        Confirm Ride
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status UI */}
                    {status === 'requesting' && (
                        <div className="p-6 bg-gray-100 rounded-xl animate-pulse">
                            <p className="text-xl font-medium">Requesting ride...</p>
                        </div>
                    )}

                    {status === 'requested' && (
                        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <h3 className="text-xl font-bold mb-2">Looking for drivers...</h3>
                            <p className="text-gray-600">Please wait while we find a driver near you.</p>
                            <div className="mt-4 flex items-center space-x-2">
                                <span className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></span>
                                <span className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce delay-100"></span>
                                <span className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}

                    {status === 'accepted' && (
                        <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                            <h3 className="text-xl font-bold text-green-800 mb-2">Driver Found!</h3>
                            <p className="text-gray-800">
                                <strong>{currentRide?.driver}</strong> is on their way.
                            </p>
                            <p className="mt-2 text-sm text-gray-500">Pick up at: {currentRide?.pickup_address}</p>
                            <div className="mt-4 pt-4 border-t border-green-200 flex justify-between">
                                <span className="text-green-800 font-medium">Fare</span>
                                <span className="text-green-800 font-bold">BDT {currentRide?.estimated_fare}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Map */}
                <div className="relative h-96 md:h-[500px] w-full bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                    <Map />
                </div>

            </div>

            {/* Suggestions Grid (Only show when idle) */}
            {status === 'idle' && (
                <div className="mt-24">
                    <h2 className="text-2xl font-bold text-black mb-8">Suggestions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 p-6 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer flex flex-col justify-between h-48">
                            <div>
                                <h3 className="text-xl font-semibold text-black mb-1">Ride</h3>
                                <p className="text-sm text-gray-500">Go anywhere with RickShare. Request a ride, hop in, and go.</p>
                            </div>
                            <div className="self-end mt-4">
                                <div className="w-12 h-8 bg-gray-300 rounded-md"></div>
                            </div>
                        </div>
                        {/* More cards... */}
                    </div>
                </div>
            )}
        </main>
    );
}
