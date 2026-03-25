import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  provider: 'credentials' | 'google';
  emailVerified: boolean;
  businessName?: string;
  brandColor: string;
  brandLogo?: string;
  mpAccessToken?: string;
  mpPublicKey?: string;
  transferCbu?: string;
  transferAlias?: string;
  transferHolder?: string;
  plan: 'free' | 'pro';
  planExpiresAt?: Date;
  mpSubscriptionId?: string;
  reminderSentAt?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    image: { type: String },
    provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    emailVerified: { type: Boolean, default: false },
    businessName: { type: String },
    brandColor: { type: String, default: '#6366f1' },
    brandLogo: { type: String },
    mpAccessToken: { type: String },
    mpPublicKey: { type: String },
    transferCbu: { type: String },
    transferAlias: { type: String },
    transferHolder: { type: String },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    planExpiresAt: { type: Date },
    mpSubscriptionId: { type: String },
    reminderSentAt: { type: Date },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export default User;
