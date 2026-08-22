import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

export function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derived = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return `${salt}:${derived}`;
}

export function verifyPassword(password, hashedPassword) {
    const [salt, storedHash] = String(hashedPassword).split(":");
    if (!salt || !storedHash) return false;

    const derived = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(derived, "hex"));
}

function base64UrlEncode(value) {
    return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
    return Buffer.from(value, "base64").toString("utf8");
}

export function signToken(payload) {
    const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${header}.${body}`;
    const signature = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(signingInput)
        .digest("base64url");

    return `${signingInput}.${signature}`;
}

export function verifyToken(token) {
    const parts = String(token).split(".");
    if (parts.length !== 3) throw new Error("Invalid token format.");

    const [header, payload, signature] = parts;
    const expected = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        throw new Error("Invalid token signature.");
    }

    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    return decodedPayload;
}
