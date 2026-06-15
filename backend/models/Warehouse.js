import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
});

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    locations: [locationSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Warehouse', warehouseSchema);
