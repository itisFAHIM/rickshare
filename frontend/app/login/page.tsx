"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import Link from "next/link";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const res = await api.post("/token/", { username, password });
            login(res.data.access, res.data.refresh);
        } catch (err: any) {
            setError("Invalid credentials");
            console.error(err);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="mb-6 text-3xl font-bold text-center text-gray-900 dark:text-white">
                    Login
                </h2>
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
                    >
                        Login
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-blue-500 hover:text-blue-700">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
