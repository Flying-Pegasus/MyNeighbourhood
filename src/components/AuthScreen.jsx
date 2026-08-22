import React, { useState } from "react";
import * as API from "../services/api";

export default function AuthScreen({ onAuthSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({
        name: "",
        email: "alex@civicpulse.ai",
        password: "Password123!",
        role: "Citizen"
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = isLogin
                ? await API.login(form.email, form.password)
                : await API.register({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role: form.role
                });

            onAuthSuccess(response);
        } catch (err) {
            setError(err.message || "Authentication failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">MN</div>
                    <h1 className="text-2xl font-black text-slate-900">MyNeighbourhood</h1>
                    <p className="mt-2 text-sm text-slate-500">Sign in to manage civic issues and community impact.</p>
                </div>

                <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
                    <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${!isLogin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Full name</label>
                            <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Jane Citizen" required />
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="you@example.com" required />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Password</label>
                        <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="••••••••" required />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">Role</label>
                            <select name="role" value={form.role} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500">
                                <option value="Citizen">Citizen</option>
                                <option value="Officer">Officer</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    )}

                    {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

                    <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400">
                        {loading ? "Please wait..." : isLogin ? "Login" : "Create account"}
                    </button>
                </form>

                <div className="mt-5 text-center text-xs text-slate-500">
                    Demo accounts: <span className="font-bold text-slate-700">alex@civicpulse.ai / Password123!</span>
                </div>
            </div>
        </div>
    );
}
