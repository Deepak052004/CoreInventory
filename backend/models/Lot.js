import mongoose from 'mongoose';

const lotSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    identifier: { type: String, required: true, uppercase: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'depleted', 'quarantined'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// A lot identifier must be unique per product (e.g. SN-123 should only exist once for an iPhone)
lotSchema.index({ product: 1, identifier: 1 }, { unique: true });

export default mongoose.model('Lot', lotSchema);
