import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

const JWT_SECRET: string = SECRET;

// User access token expires in 5 minutes
export function createAccessToken(): string {
  return jwt.sign({ access: true }, JWT_SECRET, { expiresIn: '5m' });
}

// Admin token expires in 7 days
export function createAdminToken(): string {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}
