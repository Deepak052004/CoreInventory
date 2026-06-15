import Adjustment from '../models/Adjustment.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';

export const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [adjustments, total] = await Promise.all([
      Adjustment.find()
        .populate('product')
        .populate('warehouse')
        .populate('createdBy', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Adjustment.countDocuments(),
    ]);
    res.json({ success: true, data: adjustments, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { product, warehouse, locationName, countedQuantity, reason } = req.body;
    const prod = await Product.findById(product);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
    const systemQuantity = prod.stockQuantity ?? 0;
    const difference = Number(countedQuantity) - systemQuantity;
    const adjustment = await Adjustment.create({
      product,
      warehouse,
      locationName: locationName || '',
      systemQuantity,
      countedQuantity: Number(countedQuantity),
      difference,
      reason: reason || '',
      createdBy: req.user._id,
    });
    prod.stockQuantity = Number(countedQuantity);
    const locEntry = prod.stockByLocation?.find((s) => s.warehouse?.toString() === warehouse);
    if (locEntry) locEntry.quantity = Number(countedQuantity);
    else if (prod.stockByLocation?.length) {
      prod.stockByLocation.push({ warehouse, locationName: locationName || '', quantity: Number(countedQuantity) });
    }
    await prod.save();
    await StockLedger.create({
      product,
      quantity: difference,
      operationType: 'adjustment',
      sourceWarehouse: warehouse,
      reference: `ADJ-${adjustment._id}`,
      user: req.user._id,
    });
    const populated = await Adjustment.findById(adjustment._id).populate('product').populate('warehouse');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};
