import { NextRequest } from 'next/server';

/**
 * Verifica que el Origin de la request coincida con la URL de la app.
 * Protege contra CSRF en rutas que mutan datos.
 * Requests sin Origin header (misma origin, server-to-server) pasan por defecto.
 */
export function checkOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // mismo origen, no hay header Origin

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return true; // si no está configurado, no bloqueamos

  try {
    const expected = new URL(appUrl).origin;
    return origin === expected;
  } catch {
    return false;
  }
}
