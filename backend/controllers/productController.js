import Product from '../models/Product.js';
import mongoose from 'mongoose';

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
    if (warehouse) query['stockByLocation.warehouse'] = warehouse;
    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(query).populate('category').populate('warehouseLocation').sort(sort).skip(skip).limit(Number(limit)),
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
      .populate('warehouseLocation')
      .populate('stockByLocation.warehouse');
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
