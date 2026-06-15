import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    sourceLocationName: { type: String, default: '' },
    destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    destinationLocationName: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'in_transit', 'done', 'cancelled'],
      default: 'draft',
    },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Transfer', transferSchema);
