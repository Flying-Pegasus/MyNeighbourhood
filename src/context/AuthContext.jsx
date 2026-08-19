import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as loginRequest, register as registerRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mn_user")) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const persistSession = (data) => {
    if (data.token) localStorage.setItem("mn_token", data.token);
    if (data.user) {
      localStorage.setItem("mn_user", JSON.stringify(data.user));
      setUser(data.user);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      persistSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const data = await registerRequest(payload);
      persistSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("mn_token");
    localStorage.removeItem("mn_user");
    setUser(null);
  };

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, isAuthenticated: !!user }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
