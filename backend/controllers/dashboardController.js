import Product from '../models/Product.js';
import Receipt from '../models/Receipt.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Transfer from '../models/Transfer.js';
import StockLedger from '../models/StockLedger.js';
import mongoose from 'mongoose';

export const getKpis = async (req, res, next) => {
  try {
    const [totalProducts, lowStock, outOfStock, pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $gt: ['$reorderLevel', '$stockQuantity'] }, stockQuantity: { $gt: 0 } }),
      Product.countDocuments({ $or: [{ stockQuantity: 0 }, { stockQuantity: { $exists: false } }] }),
      Receipt.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } }),
      DeliveryOrder.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } }),
      Transfer.countDocuments({ status: { $in: ['draft', 'scheduled', 'in_transit'] } }),
    ]);
    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockItems: lowStock,
        outOfStockItems: outOfStock,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getInventoryDistribution = async (req, res, next) => {
  try {
    const distribution = await Product.aggregate([
      { $match: { stockQuantity: { $gt: 0 } } },
      { $group: { _id: '$category', totalQuantity: { $sum: '$stockQuantity' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      { $project: { categoryName: '$cat.name', totalQuantity: 1 } },
    ]);
    res.json({ success: true, data: distribution });
  } catch (err) {
    next(err);
  }
};

export const getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stockQuantity' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: '$cat' },
      { $project: { name: '$cat.name', count: 1, totalStock: 1 } },
    ]);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

export const getStockMovementHistory = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    const start = new Date();
    start.setDate(start.getDate() - days);
    const history = await StockLedger.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

export const getDashboardFilters = async (req, res, next) => {
  try {
    const { documentType, status, warehouse, category } = req.query;
    // Return counts for filter chips - can be used by frontend
    const Warehouse = (await import('../models/Warehouse.js')).default;
    const Category = (await import('../models/Category.js')).default;
    const [warehouses, categories] = await Promise.all([Warehouse.find().select('name _id'), Category.find().select('name _id')]);
    res.json({ success: true, data: { warehouses, categories } });
  } catch (err) {
    next(err);
  }
};
