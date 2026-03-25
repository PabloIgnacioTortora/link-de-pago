import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { sendPlanExpiryReminderEmail } from '@/lib/email/mailer';

export async function GET(req: NextRequest) {
  // Verificar que viene de Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // 1. Downgrade usuarios con plan Pro expirado
  const expired = await User.find({
    plan: 'pro',
    planExpiresAt: { $lt: now },
  }).select('_id');

  if (expired.length > 0) {
    await User.updateMany(
      { _id: { $in: expired.map((u) => u._id) } },
      { $set: { plan: 'free', planExpiresAt: undefined } }
    );
    console.log(`[cron] Downgraded ${expired.length} expired Pro users`);
  }

  // 2. Email de aviso a usuarios que vencen en 3 días
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const soonExpiring = await User.find({
    plan: 'pro',
    planExpiresAt: { $gte: now, $lte: threeDaysFromNow },
    reminderSentAt: { $exists: false }, // no enviar dos veces
  }).select('email name businessName planExpiresAt');

  for (const user of soonExpiring) {
    try {
      await sendPlanExpiryReminderEmail({
        to: user.email,
        name: user.businessName ?? user.name,
        expiresAt: user.planExpiresAt!,
        appUrl,
      });
      await User.findByIdAndUpdate(user._id, { $set: { reminderSentAt: now } });
    } catch (err) {
      console.error(`[cron] Error enviando reminder a ${user.email}:`, err);
    }
  }

  console.log(`[cron] Reminders sent: ${soonExpiring.length}`);

  return NextResponse.json({
    downgraded: expired.length,
    reminders: soonExpiring.length,
  });
}
