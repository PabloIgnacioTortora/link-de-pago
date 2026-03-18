import mongoose, { Schema, Model } from 'mongoose';
import connectDB from '@/lib/db/mongoose';

interface IRateLimit {
  key: string;
  count: number;
  resetAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 1 },
  resetAt: { type: Date, required: true },
});

// TTL index — MongoDB elimina el documento automáticamente cuando expira
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitModel: Model<IRateLimit> =
  mongoose.models.RateLimit ?? mongoose.model<IRateLimit>('RateLimit', RateLimitSchema);

interface RateLimitOptions {
  /** Clave única: ej. `register:ip` */
  key: string;
  /** Máximo de requests permitidos en la ventana */
  limit: number;
  /** Duración de la ventana en segundos */
  windowSeconds: number;
}

/**
 * Retorna `true` si la request debe ser bloqueada (límite superado).
 */
export async function isRateLimited({ key, limit, windowSeconds }: RateLimitOptions): Promise<boolean> {
  await connectDB();

  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  const doc = await RateLimitModel.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { resetAt },
    },
    { upsert: true, new: true }
  );

  return doc.count > limit;
}
