import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: 'CoreInventory' },
    companyEmail: { type: String, default: 'contact@coreinventory.app' },
    companyPhone: { type: String, default: '+1 (555) 123-4567' },
    companyAddress: { type: String, default: '123 Warehouse Lane, Logistics City, CA 90210' },
    currencySymbol: { type: String, default: '$' },
    defaultTaxRate: { type: Number, default: 10 },
    logoUrl: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);
