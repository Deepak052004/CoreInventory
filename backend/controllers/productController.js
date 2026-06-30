import Product from '../models/Product.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';

export const getAll = async (req, res, next) => {
  try {
    const { search, category, warehouse, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { SKU: new RegExp(search, 'i') },
      ];
    }
    if (category) query.category = category;
    if (warehouse) query['stockLocations.warehouse'] = warehouse;
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category').populate('stockLocations.warehouse', 'name code').sort(sort).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);
    res.json({ success: true, data: products, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('stockLocations.warehouse', 'name code location');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    const populated = await Product.findById(product._id).populate('category');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

export const importCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const importedProducts = [];
          
          for (const row of results) {
            if (!row.name || !row.SKU) continue;
            
            // Resolve category or create default
            let categoryId = null;
            if (row.category) {
              let cat = await Category.findOne({ name: new RegExp('^' + row.category + '$', 'i') });
              if (!cat) cat = await Category.create({ name: row.category, description: 'Auto-imported' });
              categoryId = cat._id;
            } else {
              let fallback = await Category.findOne({ name: 'Uncategorized' });
              if (!fallback) fallback = await Category.create({ name: 'Uncategorized' });
              categoryId = fallback._id;
            }

            // Create or Update product
            const productData = {
              name: row.name,
              SKU: row.SKU,
              category: categoryId,
              unitOfMeasure: row.unitOfMeasure || 'units',
              costPrice: Number(row.costPrice) || 0,
              sellingPrice: Number(row.sellingPrice) || 0,
              reorderLevel: Number(row.reorderLevel) || 0,
            };

            const existing = await Product.findOne({ SKU: row.SKU });
            if (existing) {
              await Product.findByIdAndUpdate(existing._id, productData);
            } else {
              const newProduct = await Product.create(productData);
              importedProducts.push(newProduct);
            }
          }

          // Cleanup file
          fs.unlinkSync(req.file.path);
          
          res.json({ success: true, message: `Successfully imported products.`, count: importedProducts.length });
        } catch (err) {
          fs.unlinkSync(req.file.path);
          next(err);
        }
      });
  } catch (err) {
    next(err);
  }
};
