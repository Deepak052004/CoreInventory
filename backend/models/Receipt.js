import mongoose from 'mongoose';

const receiptLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  lotIdentifier: { type: String, trim: true, uppercase: true }, // Optional for non-tracked, required for tracked
  expiryDate: { type: Date }, // Optional
  locationName: { type: String, default: '' },
});

const receiptSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    supplier: { type: String, required: true },
    lines: [receiptLineSchema],
    status: {
      type: String,
      enum: ['draft', 'waiting', 'ready', 'done', 'cancelled'],
      default: 'draft',
    },
    validatedAt: { type: Date },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Receipt', receiptSchema);
