import mongoose from 'mongoose';

const returnLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  reason: { type: String, default: 'Defective/Unwanted' },
  condition: { type: String, enum: ['new', 'used', 'damaged', 'unknown'], default: 'unknown' },
});

const returnOrderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    type: { type: String, enum: ['inbound', 'outbound'], required: true },
    
    // For inbound returns (RMA from customer)
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
    
    // For outbound returns (RTV to supplier)
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    
    lines: [returnLineSchema],
    
    status: {
      type: String,
      enum: ['draft', 'pending_inspection', 'approved', 'processed', 'cancelled'],
      default: 'draft',
    },
    
    notes: { type: String },
    
    processedAt: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('ReturnOrder', returnOrderSchema);
