import PurchaseOrder from '../models/PurchaseOrder.js';
import { sendPurchaseOrder } from '../utils/emailService.js';

export const getAll = async (req, res, next) => {
  try {
    const { search, status, supplier, warehouse, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.poNumber = new RegExp(search, 'i');
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (warehouse) query.warehouse = warehouse;

    const skip = (Number(page) - 1) * Number(limit);
    const [pos, total] = await Promise.all([
      PurchaseOrder.find(query)
        .populate('supplier', 'name code')
        .populate('warehouse', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PurchaseOrder.countDocuments(query),
    ]);

    res.json({ success: true, data: pos, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('warehouse')
      .populate('items.product', 'name SKU unitOfMeasure')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
      
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    res.json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
};

const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.requestedQty * item.unitPrice), 0);
  const tax = subtotal * 0.1; // Simple 10% tax for example purposes
  const totalAmount = subtotal + tax;
  return { subtotal, tax, totalAmount };
};

export const create = async (req, res, next) => {
  try {
    const { items, ...rest } = req.body;
    
    // Auto-calculate line totals
    const processedItems = items.map(item => ({
      ...item,
      total: item.requestedQty * item.unitPrice
    }));
    
    const { subtotal, tax, totalAmount } = calculateTotals(processedItems);
    
    // Generate PO Number (mock logic, ideally atomic sequence)
    const count = await PurchaseOrder.countDocuments();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const po = await PurchaseOrder.create({
      ...rest,
      poNumber,
      items: processedItems,
      subtotal,
      tax,
      totalAmount,
      createdBy: req.user._id,
      status: req.body.status === 'submitted' ? 'submitted' : 'draft',
    });
    
    res.status(201).json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    
    if (po.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft POs can be edited' });
    }

    const { items, status, ...rest } = req.body;
    let updateData = { ...rest, status: status === 'submitted' ? 'submitted' : 'draft' };
    
    if (items) {
      const processedItems = items.map(item => ({
        ...item,
        total: item.requestedQty * item.unitPrice
      }));
      const totals = calculateTotals(processedItems);
      updateData = { ...updateData, items: processedItems, ...totals };
    }

    const updatedPo = await PurchaseOrder.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: updatedPo });
  } catch (err) {
    next(err);
  }
};

export const approve = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    
    if (po.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted POs can be approved' });
    }

    po.status = 'approved';
    po.approvedBy = req.user._id;
    po.approvedAt = new Date();
    
    await po.save();
    
    await po.populate('supplier');
    await po.populate('items.product', 'SKU name');
    sendPurchaseOrder(po, po.supplier?.email).catch(err => console.error('Email Error:', err));
    
    res.json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Purchase Order not found' });
    
    if (po.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed PO' });
    }

    po.status = 'cancelled';
    await po.save();
    res.json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
};
