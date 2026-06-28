import jwt from "jsonwebtoken";

export const ADMIN_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface AdminPayload {
  role: "admin";
  iat?: number;
  exp?: number;
}

function getSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_JWT_SECRET belum di-set di environment variables.",
    );
  }
  return secret;
}

export function signSession(): string {
  return jwt.sign({ role: "admin" }, getSecret(), {
    expiresIn: SESSION_TTL_SECONDS,
  });
}

export function verifySession(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, getSecret()) as AdminPayload;
    return decoded.role === "admin";
  } catch {
    return false;
  }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_TTL_SECONDS;
