import mongoose from 'mongoose';

const soItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  requestedQty: { type: Number, required: true, min: 1 },
  deliveredQty: { type: Number, default: 0, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }, // requestedQty * unitPrice
});

const salesOrderSchema = new mongoose.Schema(
  {
    soNumber: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' }, // Optional default warehouse
    items: [soItemSchema],
    
    // Financials
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    
    // Workflow State
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'partial', 'completed', 'cancelled'],
      default: 'draft',
    },
    
    expectedShipDate: { type: Date },
    notes: { type: String },
    
    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for fast lookups and reporting
salesOrderSchema.index({ soNumber: 1 }, { unique: true });
salesOrderSchema.index({ customer: 1 });
salesOrderSchema.index({ status: 1 });
salesOrderSchema.index({ createdAt: -1 });

export default mongoose.model('SalesOrder', salesOrderSchema);
