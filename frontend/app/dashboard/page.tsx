'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-4">Welcome, {user.username}!</h1>
            <p className="text-xl text-gray-400">Role: {user.role}</p>
            <div className="mt-8 p-6 bg-gray-800 rounded-lg">
                <h2 className="text-2xl font-semibold mb-4">Map Placeholder</h2>
                <div className="h-64 bg-gray-700 rounded flex items-center justify-center text-gray-500">
                    Map will be integrated here
                </div>
            </div>
            <button
                onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.push('/login');
                }}
                className="mt-8 bg-red-600 hover:bg-red-500 px-6 py-2 rounded"
            >
                Logout
            </button>
        </div>
    );
}
