import mongoose from 'mongoose';

const stockLocationSchema = new mongoose.Schema(
  {
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    quantity: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    maxStockLevel: { type: Number, min: 0 },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    SKU: { type: String, required: true, unique: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    unitOfMeasure: { type: String, default: 'units' },
    
    // Costing and Valuation
    costPrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    
    // Traceability
    trackingType: { type: String, enum: ['none', 'batch', 'serial'], default: 'none' },
    
    // Multi-warehouse stock tracking
    stockLocations: [stockLocationSchema],
    
    // Global reorder level (optional fallback)
    reorderLevel: { type: Number, default: 0, min: 0 },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for total stock across all warehouses
productSchema.virtual('totalStock').get(function () {
  if (!this.stockLocations || this.stockLocations.length === 0) return 0;
  return this.stockLocations.reduce((sum, loc) => sum + (loc.quantity || 0), 0);
});

// Indexes for fast lookup
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });

export default mongoose.model('Product', productSchema);
