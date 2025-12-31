'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('rider');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/users/signup/', { username, email, password, role });
            // Auto login or redirect to login
            router.push('/login');
        } catch (err) {
            setError('Signup failed. Username might be taken.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
                <h1 className="text-4xl font-bold text-center mb-2 tracking-tighter">Join RickShare</h1>
                <p className="text-center text-gray-300 mb-8">Start your interdimensional journey.</p>

                {error && <div className="bg-red-500/50 text-red-100 p-3 rounded mb-4 text-center">{error}</div>}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white placeholder-gray-500"
                            placeholder="PickleRick"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white placeholder-gray-500"
                            placeholder="rick@citadel.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors text-white placeholder-gray-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">I am a...</label>
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setRole('rider')}
                                className={`flex-1 py-2 rounded-lg border ${role === 'rider' ? 'bg-purple-600 border-purple-500' : 'bg-black/30 border-gray-600 hover:bg-white/5'}`}
                            >
                                Rider
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('driver')}
                                className={`flex-1 py-2 rounded-lg border ${role === 'driver' ? 'bg-blue-600 border-blue-500' : 'bg-black/30 border-gray-600 hover:bg-white/5'}`}
                            >
                                Driver
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg mt-4"
                    >
                        Create Account
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
