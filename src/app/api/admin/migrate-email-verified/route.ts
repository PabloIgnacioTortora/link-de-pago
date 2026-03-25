import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';

/**
 * Migración one-time: marca emailVerified=true en todos los usuarios existentes.
 * Protegido por CRON_SECRET. Correr una sola vez, luego eliminar este endpoint.
 *
 * Uso:
 *   curl -X POST https://<tu-dominio>/api/admin/migrate-email-verified \
 *     -H "Authorization: Bearer <CRON_SECRET>"
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await connectDB();

  const result = await User.updateMany(
    { emailVerified: { $ne: true } },
    { $set: { emailVerified: true } }
  );

  console.log(`[migration] emailVerified=true aplicado a ${result.modifiedCount} usuarios`);

  return NextResponse.json({
    ok: true,
    updated: result.modifiedCount,
  });
}
