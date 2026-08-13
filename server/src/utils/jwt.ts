import jwt from "jsonwebtoken";

export function signAuthToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign({ sub: userId }, secret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  const payload = jwt.verify(token, secret);
  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Invalid token payload");
  }

  return String(payload.sub);
}
