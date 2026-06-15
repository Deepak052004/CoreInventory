import mongoose from 'mongoose';

const deliveryLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationName: { type: String, default: '' },
});

const deliveryOrderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: { type: String, required: true },
    lines: [deliveryLineSchema],
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

export default mongoose.model('DeliveryOrder', deliveryOrderSchema);
