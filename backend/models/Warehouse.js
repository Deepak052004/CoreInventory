import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
});

const warehouseSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    capacity: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
    contact: { type: String, default: '' },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    locations: [locationSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Warehouse', warehouseSchema);
