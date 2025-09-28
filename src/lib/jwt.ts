import { SignJWT, jwtVerify } from 'jose';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'default-secret-key-for-development';
  return new TextEncoder().encode(secret);
};

export const JWT_SECRET = getJwtSecret();

export async function createJWT(payload: Record<string, unknown>, expirationTime = '24h') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string) {
  return await jwtVerify(token, JWT_SECRET);
}