import { hashPassword, verifyPassword } from "../utils/auth.js";

const demoUsers = [
    {
        _id: "demo-citizen-alex",
        name: "Alex Reed",
        email: "alex@civicpulse.ai",
        password: hashPassword("Password123!"),
        role: "Citizen",
        points: 145,
        badges: ["Local Reporter", "Neighborhood Guardian"],
        credibilityScore: 92
    },
    {
        _id: "demo-citizen-maria",
        name: "Maria Santos",
        email: "maria@civicpulse.ai",
        password: hashPassword("Password123!"),
        role: "Citizen",
        points: 55,
        badges: ["Local Reporter"],
        credibilityScore: 85
    },
    {
        _id: "demo-officer-marcus",
        name: "Officer Marcus Vance",
        email: "marcus.vance@metro.gov",
        password: hashPassword("Password123!"),
        role: "Officer",
        points: 0,
        badges: [],
        credibilityScore: 100
    },
    {
        _id: "demo-admin-sarah",
        name: "Director Sarah Jenkins",
        email: "sarah.jenkins@metro.gov",
        password: hashPassword("Password123!"),
        role: "Admin",
        points: 0,
        badges: [],
        credibilityScore: 100
    }
];

export function getFallbackUserStore() {
    if (!globalThis.__MN_FALLBACK_USERS__) {
        globalThis.__MN_FALLBACK_USERS__ = demoUsers.map((user) => ({ ...user }));
    }
    return globalThis.__MN_FALLBACK_USERS__;
}

export function getFallbackUserById(id) {
    return getFallbackUserStore().find((user) => user._id === id);
}

export function getFallbackUserByEmail(email) {
    const normalized = String(email || "").trim().toLowerCase();
    return getFallbackUserStore().find((user) => user.email.toLowerCase() === normalized);
}

export function setFallbackUser(userData) {
    const store = getFallbackUserStore();
    const nextUser = {
        ...userData,
        _id: userData._id || `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: userData.role || "Citizen",
        points: userData.points ?? 0,
        badges: userData.badges || [],
        credibilityScore: userData.credibilityScore ?? 75
    };
    store.push(nextUser);
    return nextUser;
}

export function verifyFallbackCredentials(email, password) {
    const user = getFallbackUserByEmail(email);
    if (!user) return null;
    return verifyPassword(password, user.password) ? user : null;
}
