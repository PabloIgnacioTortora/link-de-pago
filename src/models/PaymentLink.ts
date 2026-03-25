import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPaymentLink extends Document {
  merchantId: Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  slug: string;
  isActive: boolean;
  maxPayments?: number;
  expiresAt?: Date;
  successUrl?: string;
  successMessage?: string;
  totalCollected: number;
  paymentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentLinkSchema = new Schema<IPaymentLink>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'ARS' },
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    maxPayments: { type: Number },
    expiresAt: { type: Date },
    successUrl: { type: String },
    successMessage: { type: String },
    totalCollected: { type: Number, default: 0 },
    paymentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PaymentLinkSchema.index({ merchantId: 1, createdAt: -1 });

const PaymentLink: Model<IPaymentLink> =
  mongoose.models.PaymentLink ?? mongoose.model<IPaymentLink>('PaymentLink', PaymentLinkSchema);

export default PaymentLink;
