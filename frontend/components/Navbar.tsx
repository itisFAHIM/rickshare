"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="bg-black text-white w-full z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Main Links */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-2xl font-normal tracking-tight hover:opacity-80 transition-opacity">
                            RickShare
                        </Link>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                                    Ride
                                </Link>
                                <Link href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                                    Drive
                                </Link>
                                <Link href="#" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                                    Business
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6 gap-4">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium">{user.username}</span>
                                    <button
                                        onClick={() => logout()}
                                        className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Log out
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <Link href="/login" className="text-sm font-medium hover:text-gray-300 transition-colors">
                                        Log in
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black">
                        <Link href="#" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800">Ride</Link>
                        <Link href="#" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800">Drive</Link>
                        {!user ? (
                            <>
                                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800">Log in</Link>
                                <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium bg-white text-black mt-2">Sign up</Link>
                            </>
                        ) : (
                            <button onClick={() => logout()} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800">Log out</button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
