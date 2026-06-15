import DeliveryOrder from '../models/DeliveryOrder.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import { generateReference } from '../utils/generateReference.js';

export const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [deliveries, total] = await Promise.all([
      DeliveryOrder.find(query).populate('lines.product').populate('lines.warehouse').sort('-createdAt').skip(skip).limit(Number(limit)),
      DeliveryOrder.countDocuments(query),
    ]);
    res.json({ success: true, data: deliveries, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id)
      .populate('lines.product')
      .populate('lines.warehouse');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery order not found' });
    res.json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const ref = generateReference('DO');
    const delivery = await DeliveryOrder.create({
      reference: ref,
      customer: req.body.customer,
      lines: req.body.lines || [],
      status: 'draft',
      createdBy: req.user._id,
    });
    const populated = await DeliveryOrder.findById(delivery._id).populate('lines.product').populate('lines.warehouse');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery order not found' });
    if (delivery.status === 'done') return res.status(400).json({ success: false, message: 'Cannot edit validated order' });
    if (req.body.customer) delivery.customer = req.body.customer;
    if (req.body.lines) delivery.lines = req.body.lines;
    await delivery.save();
    const populated = await DeliveryOrder.findById(delivery._id).populate('lines.product').populate('lines.warehouse');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const validateDelivery = async (req, res, next) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id).populate('lines.product').populate('lines.warehouse');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery order not found' });
    if (delivery.status === 'done') return res.status(400).json({ success: false, message: 'Already validated' });
    for (const line of delivery.lines) {
      const product = await Product.findById(line.product._id);
      if (!product) return res.status(400).json({ success: false, message: `Product ${line.product.name} not found` });
      const current = product.stockQuantity || 0;
      if (current < line.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      product.stockQuantity = current - line.quantity;
      const locEntry = product.stockByLocation?.find((s) => s.warehouse?.toString() === line.warehouse._id.toString());
      if (locEntry) locEntry.quantity = Math.max(0, (locEntry.quantity || 0) - line.quantity);
      await product.save();
      await StockLedger.create({
        product: product._id,
        quantity: -line.quantity,
        operationType: 'delivery',
        sourceWarehouse: line.warehouse._id,
        sourceLocationName: line.locationName || '',
        reference: delivery.reference,
        user: req.user._id,
      });
    }
    delivery.status = 'done';
    delivery.validatedAt = new Date();
    delivery.validatedBy = req.user._id;
    await delivery.save();
    const populated = await DeliveryOrder.findById(delivery._id).populate('lines.product').populate('lines.warehouse');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery order not found' });
    if (delivery.status === 'done') return res.status(400).json({ success: false, message: 'Cannot delete validated order' });
    await DeliveryOrder.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Delivery order deleted' });
  } catch (err) {
    next(err);
  }
};
