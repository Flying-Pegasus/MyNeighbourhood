import User from "../models/User.js";
import { verifyToken } from "../utils/auth.js";
import { getFallbackUserById } from "../config/fallbackStore.js";

export async function protect(req, res, next) {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ error: "Authentication required." });
        }

        const decoded = verifyToken(token);
        if (!decoded?.id || decoded.exp < Math.floor(Date.now() / 1000)) {
            return res.status(401).json({ error: "Token expired or invalid." });
        }

        const fallbackUser = getFallbackUserById(decoded.id);
        if (fallbackUser) {
            req.user = fallbackUser;
            return next();
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ error: "User not found." });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
}
