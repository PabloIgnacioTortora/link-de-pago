import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';

export interface ITransaction extends Document {
  paymentLinkId: Types.ObjectId;
  merchantId: Types.ObjectId;
  mpPaymentId: string;
  mpPreferenceId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  statusDetail?: string;
  payerEmail?: string;
  payerName?: string;
  paymentMethod?: string;
  notificationSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    paymentLinkId: { type: Schema.Types.ObjectId, ref: 'PaymentLink', required: true, index: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mpPaymentId: { type: String, required: true, unique: true },
    mpPreferenceId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'refunded', 'cancelled'],
      default: 'pending',
    },
    statusDetail: { type: String },
    payerEmail: { type: String },
    payerName: { type: String },
    paymentMethod: { type: String },
    notificationSentAt: { type: Date },
  },
  { timestamps: true }
);

TransactionSchema.index({ merchantId: 1, createdAt: -1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ?? mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
