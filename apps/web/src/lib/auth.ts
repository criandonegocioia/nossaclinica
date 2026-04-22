import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Extract and verify JWT from Authorization header.
 * Returns the payload or null if invalid/missing.
 */
export async function getCurrentUser(request: NextRequest): Promise<JwtPayload | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'trocar-em-producao-chave-segura-256bits');

  try {
    const { payload } = await jose.jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Helper to require authentication. Returns 401 if not authenticated.
 */
export async function requireAuth(request: NextRequest): Promise<{ user: JwtPayload } | NextResponse> {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }
  return { user };
}

/**
 * Generate JWT tokens using jose (Edge-compatible).
 */
export async function generateTokens(payload: JwtPayload): Promise<{ accessToken: string; refreshToken: string }> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'trocar-em-producao-chave-segura-256bits');
  const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'trocar-em-producao-refresh-segura-256bits');

  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  const [accessToken, refreshToken] = await Promise.all([
    new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(expiresIn)
      .sign(secret),
    new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(refreshExpiresIn)
      .sign(refreshSecret),
  ]);

  return { accessToken, refreshToken };
}
