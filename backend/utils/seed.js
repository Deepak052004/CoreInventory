/**
 * Seed script - run with: node utils/seed.js
 * Ensure you run from backend directory or set MONGODB_URI
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from '../models/User.js';
import Category from '../models/Category.js';
import Warehouse from '../models/Warehouse.js';
import Product from '../models/Product.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coreinventory';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const categories = await Category.insertMany([
    { name: 'Electronics', description: 'Electronic devices and components' },
    { name: 'Office Supplies', description: 'Stationery and office items' },
    { name: 'Raw Materials', description: 'Raw materials for production' },
    { name: 'Finished Goods', description: 'Ready to ship products' },
    { name: 'Consumables', description: 'Consumable items' },
  ]);
  console.log('Categories created');

  const warehouses = await Warehouse.insertMany([
    { name: 'Main Warehouse', location: 'Building A', description: 'Primary storage', locations: [{ name: 'A1', description: 'Rack A1' }, { name: 'A2', description: 'Rack A2' }] },
    { name: 'Secondary Warehouse', location: 'Building B', description: 'Secondary storage', locations: [{ name: 'B1' }, { name: 'B2' }] },
    { name: 'Returns Center', location: 'Building C', description: 'Returns and refurbishment', locations: [{ name: 'C1' }] },
  ]);
  console.log('Warehouses created');

  const products = [];
  const skus = ['ELEC-001', 'ELEC-002', 'OFF-001', 'OFF-002', 'RAW-001', 'RAW-002', 'FG-001', 'FG-002', 'CONS-001', 'CONS-002'];
  const names = ['Laptop Pro', 'Wireless Mouse', 'Notebook Pack', 'Pen Set', 'Steel Rod', 'Plastic Sheet', 'Widget A', 'Widget B', 'Cleaning Kit', 'Tape Roll'];
  for (let i = 0; i < 10; i++) {
    products.push({
      name: names[i],
      SKU: skus[i],
      category: categories[i % categories.length]._id,
      unitOfMeasure: 'units',
      stockQuantity: Math.floor(Math.random() * 200) + 10,
      warehouseLocation: warehouses[0]._id,
      reorderLevel: 20,
      stockByLocation: [{ warehouse: warehouses[0]._id, locationName: 'A1', quantity: Math.floor(Math.random() * 100) + 5 }],
    });
  }
  await Product.insertMany(products);
  console.log('Products created');

  const existingUser = await User.findOne({ email: 'admin@coreinventory.com' });
  if (!existingUser) {
    await User.create({ name: 'Admin', email: 'admin@coreinventory.com', password: 'admin123', role: 'admin' });
    console.log('Demo user created: admin@coreinventory.com / admin123');
  }

  console.log('Seed completed successfully');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
