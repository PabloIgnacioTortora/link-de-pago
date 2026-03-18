import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  provider: 'credentials' | 'google';
  businessName?: string;
  brandColor: string;
  brandLogo?: string;
  mpAccessToken?: string;
  mpPublicKey?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    image: { type: String },
    provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    businessName: { type: String },
    brandColor: { type: String, default: '#6366f1' },
    brandLogo: { type: String },
    mpAccessToken: { type: String },
    mpPublicKey: { type: String },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export default User;
