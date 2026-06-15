import mongoose from 'mongoose';

const adjustmentSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    locationName: { type: String, default: '' },
    systemQuantity: { type: Number, required: true },
    countedQuantity: { type: Number, required: true },
    difference: { type: Number, required: true },
    reason: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Adjustment', adjustmentSchema);
