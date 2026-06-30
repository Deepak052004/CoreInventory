import Transfer from '../models/Transfer.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import { generateReference } from '../utils/generateReference.js';

export const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [transfers, total] = await Promise.all([
      Transfer.find(query)
        .populate('product')
        .populate('sourceWarehouse')
        .populate('destinationWarehouse')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Transfer.countDocuments(query),
    ]);
    res.json({ success: true, data: transfers, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('product')
      .populate('sourceWarehouse')
      .populate('destinationWarehouse');
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    res.json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const ref = generateReference('TRF');
    const transfer = await Transfer.create({
      reference: ref,
      product: req.body.product,
      quantity: req.body.quantity,
      sourceWarehouse: req.body.sourceWarehouse,
      sourceLocationName: req.body.sourceLocationName || '',
      destinationWarehouse: req.body.destinationWarehouse,
      destinationLocationName: req.body.destinationLocationName || '',
      status: req.body.status || 'draft',
      createdBy: req.user._id,
    });
    const populated = await Transfer.findById(transfer._id)
      .populate('product')
      .populate('sourceWarehouse')
      .populate('destinationWarehouse');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const completeTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('product')
      .populate('sourceWarehouse')
      .populate('destinationWarehouse');
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transfer.status === 'done') return res.status(400).json({ success: false, message: 'Already completed' });
    const product = await Product.findById(transfer.product._id);
    if (!product) return res.status(400).json({ success: false, message: 'Product not found' });
    // Deduct from Source
    const srcEntry = product.stockLocations?.find((s) => s.warehouse?.toString() === transfer.sourceWarehouse._id.toString());
    const srcQty = srcEntry?.quantity || 0;
    if (srcQty < transfer.quantity) return res.status(400).json({ success: false, message: 'Insufficient stock at source warehouse' });
    if (srcEntry) srcEntry.quantity -= transfer.quantity;
    
    // Add to Destination
    let destEntry = product.stockLocations?.find((s) => s.warehouse?.toString() === transfer.destinationWarehouse._id.toString());
    if (!destEntry) {
      product.stockLocations = product.stockLocations || [];
      product.stockLocations.push({
        warehouse: transfer.destinationWarehouse._id,
        quantity: transfer.quantity,
        minStockLevel: 0
      });
    } else {
      destEntry.quantity = (destEntry.quantity || 0) + transfer.quantity;
    }
    
    await product.save();
    await StockLedger.create({
      product: product._id,
      quantity: -transfer.quantity,
      operationType: 'transfer_out',
      sourceWarehouse: transfer.sourceWarehouse._id,
      reference: transfer.reference,
      user: req.user._id,
    });
    await StockLedger.create({
      product: product._id,
      quantity: transfer.quantity,
      operationType: 'transfer_in',
      destinationWarehouse: transfer.destinationWarehouse._id,
      reference: transfer.reference,
      user: req.user._id,
    });
    transfer.status = 'done';
    transfer.completedAt = new Date();
    await transfer.save();
    const populated = await Transfer.findById(transfer._id)
      .populate('product')
      .populate('sourceWarehouse')
      .populate('destinationWarehouse');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transfer.status === 'done') return res.status(400).json({ success: false, message: 'Cannot delete completed transfer' });
    await Transfer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transfer deleted' });
  } catch (err) {
    next(err);
  }
};
