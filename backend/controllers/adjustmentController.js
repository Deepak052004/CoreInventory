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
    const { product, warehouse, countedQuantity, reason } = req.body;
    const prod = await Product.findById(product);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });
    
    let locEntry = prod.stockLocations?.find((s) => s.warehouse?.toString() === warehouse);
    const systemQuantity = locEntry ? (locEntry.quantity || 0) : 0;
    
    const difference = Number(countedQuantity) - systemQuantity;
    
    const adjustment = await Adjustment.create({
      product,
      warehouse,
      systemQuantity,
      countedQuantity: Number(countedQuantity),
      difference,
      reason: reason || '',
      createdBy: req.user._id,
    });
    
    if (!locEntry) {
      prod.stockLocations = prod.stockLocations || [];
      prod.stockLocations.push({ warehouse, quantity: Number(countedQuantity), minStockLevel: 0 });
    } else {
      locEntry.quantity = Number(countedQuantity);
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
