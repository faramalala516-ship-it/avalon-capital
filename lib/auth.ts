import { auth } from "@clerk/nextjs/server";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "development-secret-change-me-32-byte");

export async function getCurrentUserId() {
  const { userId } = await auth();
  return userId;
}

export async function signServiceToken(subject: string) {
  return new SignJWT({ scope: "avalon-api" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function verifyServiceToken(token: string) {
  return jwtVerify(token, secret);
}
