import mongoose from 'mongoose';

const stockByLocationSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationName: { type: String, default: '' },
  quantity: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    SKU: { type: String, required: true, unique: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    unitOfMeasure: { type: String, default: 'units' },
    stockQuantity: { type: Number, default: 0 },
    warehouseLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    reorderLevel: { type: Number, default: 0 },
    stockByLocation: [stockByLocationSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
