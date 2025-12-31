"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../lib/api";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (access: string, refresh: string) => void;
    logout: (redirect?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initAuth = async () => {
            const access = localStorage.getItem("access_token");
            if (access) {
                try {
                    // Optional: Check expiry
                    const decoded: any = jwtDecode(access);
                    const currentTime = Date.now() / 1000;
                    if (decoded.exp < currentTime) {
                        // Token expired
                        logout(false);
                    } else {
                        // Fetch user details
                        await fetchUser();
                    }
                } catch (error) {
                    console.error("Auth initialization error:", error);
                    logout(false);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/users/me/');
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user:", error);
            // Don't logout immediately on fetch fail, strictly speaking, but for now it's safer
            logout(false);
        }
    }

    const login = (access: string, refresh: string) => {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        fetchUser();
        router.push("/");
    };

    const logout = (redirect = true) => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
        if (redirect) {
            router.push("/login");
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
