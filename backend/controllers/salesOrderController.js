import SalesOrder from '../models/SalesOrder.js';

export const getAll = async (req, res, next) => {
  try {
    const { search, status, customer, warehouse, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.soNumber = new RegExp(search, 'i');
    if (status) query.status = status;
    if (customer) query.customer = customer;
    if (warehouse) query.warehouse = warehouse;

    const skip = (Number(page) - 1) * Number(limit);
    const [sos, total] = await Promise.all([
      SalesOrder.find(query)
        .populate('customer', 'name code')
        .populate('warehouse', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SalesOrder.countDocuments(query),
    ]);

    res.json({ success: true, data: sos, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const so = await SalesOrder.findById(req.params.id)
      .populate('customer')
      .populate('warehouse')
      .populate('items.product', 'name SKU unitOfMeasure')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
      
    if (!so) return res.status(404).json({ success: false, message: 'Sales Order not found' });
    res.json({ success: true, data: so });
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
    
    // Generate SO Number
    const count = await SalesOrder.countDocuments();
    const soNumber = `SO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const so = await SalesOrder.create({
      ...rest,
      soNumber,
      items: processedItems,
      subtotal,
      tax,
      totalAmount,
      createdBy: req.user._id,
      status: req.body.status === 'submitted' ? 'submitted' : 'draft',
    });
    
    res.status(201).json({ success: true, data: so });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const so = await SalesOrder.findById(req.params.id);
    if (!so) return res.status(404).json({ success: false, message: 'Sales Order not found' });
    
    if (so.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft Sales Orders can be edited' });
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

    const updatedSo = await SalesOrder.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: updatedSo });
  } catch (err) {
    next(err);
  }
};

export const approve = async (req, res, next) => {
  try {
    const so = await SalesOrder.findById(req.params.id);
    if (!so) return res.status(404).json({ success: false, message: 'Sales Order not found' });
    
    if (so.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted Sales Orders can be approved' });
    }

    so.status = 'approved';
    so.approvedBy = req.user._id;
    so.approvedAt = new Date();
    
    await so.save();
    res.json({ success: true, data: so });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const so = await SalesOrder.findById(req.params.id);
    if (!so) return res.status(404).json({ success: false, message: 'Sales Order not found' });
    
    if (so.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed Sales Order' });
    }

    so.status = 'cancelled';
    await so.save();
    res.json({ success: true, data: so });
  } catch (err) {
    next(err);
  }
};
