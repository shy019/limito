import { SignJWT, jwtVerify } from 'jose';

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

const getSecretKey = () => new TextEncoder().encode(SECRET);

// User access token expires in 1 hour
export async function createAccessToken(): Promise<string> {
  return await new SignJWT({ access: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(getSecretKey());
}

// Admin token expires in 15 minutes
export async function createAdminToken(): Promise<string> {
  return await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(getSecretKey());
}

export async function verifyAccessToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}
