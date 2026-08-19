import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("[Auth] JWT_SECRET is not configured. Set it before production deployment.");
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    JWT_SECRET || "development-only-secret",
    { expiresIn: "7d" }
  );
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Authentication required." });

  try {
    req.auth = jwt.verify(token, JWT_SECRET || "development-only-secret");
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}
