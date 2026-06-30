import Product from '../models/Product.js';
import Receipt from '../models/Receipt.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Transfer from '../models/Transfer.js';
import StockLedger from '../models/StockLedger.js';
import mongoose from 'mongoose';

export const getKpis = async (req, res, next) => {
  try {
    const [totalProducts, lowStock, outOfStock, pendingReceipts, pendingDeliveries, scheduledTransfers, valuationResult] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $gt: ['$reorderLevel', '$stockQuantity'] }, stockQuantity: { $gt: 0 } }),
      Product.countDocuments({ $or: [{ stockQuantity: 0 }, { stockQuantity: { $exists: false } }] }),
      Receipt.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } }),
      DeliveryOrder.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } }),
      Transfer.countDocuments({ status: { $in: ['draft', 'scheduled', 'in_transit'] } }),
      Product.aggregate([
        { $unwind: "$stockLocations" },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ["$stockLocations.quantity", { $ifNull: ["$costPrice", 0] }] } } } }
      ])
    ]);
    
    const totalInventoryValue = valuationResult[0]?.totalValue || 0;
    
    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockItems: lowStock,
        outOfStockItems: outOfStock,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
        totalInventoryValue,
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

export const getTopSellingItems = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const topItems = await DeliveryOrder.aggregate([
      { $match: { status: 'done', updatedAt: { $gte: start } } },
      { $unwind: '$lines' },
      { $group: { _id: '$lines.product', totalQuantity: { $sum: '$lines.quantity' } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id: 1, name: '$product.name', SKU: '$product.SKU', totalQuantity: 1, category: '$product.category' } }
    ]);

    res.json({ success: true, data: topItems });
  } catch (err) {
    next(err);
  }
};

export const getLowStockAlerts = async (req, res, next) => {
  try {
    const lowStock = await Product.aggregate([
      { 
        $match: { 
          $expr: { $lte: ['$stockQuantity', { $ifNull: ['$reorderLevel', 0] }] }
        }
      },
      { $sort: { stockQuantity: 1 } },
      { $limit: 20 },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryData' } },
      { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
      { $project: { name: 1, SKU: 1, stockQuantity: 1, reorderLevel: 1, categoryName: '$categoryData.name' } }
    ]);
    res.json({ success: true, data: lowStock });
  } catch (err) {
    next(err);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const recent = await StockLedger.find()
      .populate('product', 'name SKU')
      .populate('warehouse', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, data: recent });
  } catch (err) {
    next(err);
  }
};
