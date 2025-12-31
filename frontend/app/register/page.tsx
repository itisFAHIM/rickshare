"use client";

import { useState } from "react";
import api from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "rider",
    });
    const [error, setError] = useState("");
    const router = useRouter();
    const { login } = useAuth(); // Optional: Auto-login after register

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/users/register/", formData);
            // After register, redirect to login or auto-login
            // Auto-login attempt:
            const res = await api.post("/token/", {
                username: formData.username,
                password: formData.password,
            });
            login(res.data.access, res.data.refresh);
        } catch (err: any) {
            if (err.response && err.response.data) {
                setError(JSON.stringify(err.response.data));
            } else {
                setError("Registration failed");
            }
            console.error(err);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="mb-6 text-3xl font-bold text-center text-gray-900 dark:text-white">
                    Register
                </h2>
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800 break-words">
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
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            Role
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                            <option value="rider">Rider</option>
                            <option value="driver">Driver</option>
                        </select>
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 font-bold text-white bg-green-500 rounded hover:bg-green-700 focus:outline-none focus:shadow-outline"
                    >
                        Register
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-500 hover:text-blue-700">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
