import mongoose from 'mongoose';

const stockLedgerSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    operationType: {
      type: String,
      enum: ['receipt', 'delivery', 'transfer_in', 'transfer_out', 'adjustment', 'return_in', 'return_out'],
      required: true,
    },
    sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    sourceLocationName: { type: String, default: '' },
    destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    destinationLocationName: { type: String, default: '' },
    reference: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes for fast querying, especially for dashboards
stockLedgerSchema.index({ product: 1, createdAt: -1 });
stockLedgerSchema.index({ operationType: 1 });
stockLedgerSchema.index({ sourceWarehouse: 1 });
stockLedgerSchema.index({ destinationWarehouse: 1 });

export default mongoose.model('StockLedger', stockLedgerSchema);
