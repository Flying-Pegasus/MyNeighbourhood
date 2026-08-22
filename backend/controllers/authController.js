import User from "../models/User.js";
import { signToken, hashPassword } from "../utils/auth.js";
import {
    getFallbackUserByEmail,
    getFallbackUserById,
    setFallbackUser,
    verifyFallbackCredentials
} from "../config/fallbackStore.js";

function signTokenForUser(user) {
    return signToken({ id: String(user._id), email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 });
}

function serializeUser(user) {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        badges: user.badges,
        credibilityScore: user.credibilityScore
    };
}

export async function register(req, res) {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password are required." });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        try {
            const existingMongoUser = await User.findOne({ email: normalizedEmail });
            if (existingMongoUser) {
                return res.status(409).json({ error: "An account with that email already exists." });
            }
        } catch (mongoErr) {
            const fallbackUser = getFallbackUserByEmail(normalizedEmail);
            if (fallbackUser) {
                return res.status(409).json({ error: "An account with that email already exists." });
            }
        }

        try {
            const user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password,
                role: role || "Citizen"
            });

            const token = signTokenForUser(user);
            return res.status(201).json({ token, user: serializeUser(user) });
        } catch (mongoErr) {
            const newUser = setFallbackUser({
                name: name.trim(),
                email: normalizedEmail,
                password: hashPassword(password),
                role: role || "Citizen",
                points: 0,
                badges: [],
                credibilityScore: 75
            });

            const token = signTokenForUser(newUser);
            return res.status(201).json({ token, user: serializeUser(newUser) });
        }
    } catch (error) {
        res.status(500).json({ error: error.message || "Registration failed." });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        try {
            const user = await User.findByCredentials(normalizedEmail, password);
            if (!user) {
                return res.status(401).json({ error: "Invalid email or password." });
            }

            const token = signTokenForUser(user);
            return res.json({ token, user: serializeUser(user) });
        } catch (mongoErr) {
            const fallbackUser = verifyFallbackCredentials(normalizedEmail, password);
            if (!fallbackUser) {
                return res.status(401).json({ error: "Invalid email or password." });
            }

            const token = signTokenForUser(fallbackUser);
            return res.json({ token, user: serializeUser(fallbackUser) });
        }
    } catch (error) {
        res.status(500).json({ error: error.message || "Login failed." });
    }
}

export async function getCurrentUser(req, res) {
    try {
        const fallbackUser = getFallbackUserById(req.user._id);
        if (fallbackUser) {
            return res.json(serializeUser(fallbackUser));
        }

        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        res.json(serializeUser(user));
    } catch (error) {
        res.status(500).json({ error: error.message || "Unable to fetch user profile." });
    }
}
