"use client";

import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import PassengerDashboard from "../components/PassengerDashboard";
import DriverDashboard from "../components/DriverDashboard";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Welcome to RickShare
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              The smartest way to get around Dhaka. Safe, reliable, and always ready.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/login"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold leading-6 text-white hover:text-gray-300 transition-all"
              >
                Sign Up <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {user.role === 'driver' ? <DriverDashboard /> : <PassengerDashboard />}
    </div>
  );
}
