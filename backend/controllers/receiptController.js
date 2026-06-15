import Receipt from '../models/Receipt.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import { generateReference } from '../utils/generateReference.js';

export const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [receipts, total] = await Promise.all([
      Receipt.find(query).populate('lines.product').populate('lines.warehouse').sort('-createdAt').skip(skip).limit(Number(limit)),
      Receipt.countDocuments(query),
    ]);
    res.json({ success: true, data: receipts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('lines.product')
      .populate('lines.warehouse');
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    res.json({ success: true, data: receipt });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const ref = generateReference('REC');
    const receipt = await Receipt.create({
      reference: ref,
      supplier: req.body.supplier,
      lines: req.body.lines || [],
      status: 'draft',
      createdBy: req.user._id,
    });
    const populated = await Receipt.findById(receipt._id).populate('lines.product').populate('lines.warehouse');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ success: false, message: 'Cannot edit validated receipt' });
    if (req.body.supplier) receipt.supplier = req.body.supplier;
    if (req.body.lines) receipt.lines = req.body.lines;
    await receipt.save();
    const populated = await Receipt.findById(receipt._id).populate('lines.product').populate('lines.warehouse');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const validateReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id).populate('lines.product').populate('lines.warehouse');
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ success: false, message: 'Already validated' });
    for (const line of receipt.lines) {
      const product = await Product.findById(line.product._id);
      if (!product) continue;
      product.stockQuantity = (product.stockQuantity || 0) + line.quantity;
      let locEntry = product.stockByLocation?.find(
        (s) => s.warehouse?.toString() === line.warehouse._id.toString()
      );
      if (!locEntry) {
        product.stockByLocation = product.stockByLocation || [];
        product.stockByLocation.push({
          warehouse: line.warehouse._id,
          locationName: line.locationName || '',
          quantity: line.quantity,
        });
      } else {
        locEntry.quantity += line.quantity;
      }
      await product.save();
      await StockLedger.create({
        product: product._id,
        quantity: line.quantity,
        operationType: 'receipt',
        destinationWarehouse: line.warehouse._id,
        destinationLocationName: line.locationName || '',
        reference: receipt.reference,
        user: req.user._id,
      });
    }
    receipt.status = 'done';
    receipt.validatedAt = new Date();
    receipt.validatedBy = req.user._id;
    await receipt.save();
    const populated = await Receipt.findById(receipt._id).populate('lines.product').populate('lines.warehouse');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ success: false, message: 'Cannot delete validated receipt' });
    await Receipt.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Receipt deleted' });
  } catch (err) {
    next(err);
  }
};
