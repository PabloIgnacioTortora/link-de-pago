import mongoose, { Schema, Model } from 'mongoose';

interface IEmailVerificationToken {
  email: string;
  token: string;
  expiresAt: Date;
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailVerificationToken: Model<IEmailVerificationToken> =
  mongoose.models.EmailVerificationToken ??
  mongoose.model<IEmailVerificationToken>('EmailVerificationToken', EmailVerificationTokenSchema);

export default EmailVerificationToken;
