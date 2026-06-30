import ReturnOrder from '../models/ReturnOrder.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import { generateReference } from '../utils/generateReference.js';

export const getAll = async (req, res, next) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [returns, total] = await Promise.all([
      ReturnOrder.find(query)
        .populate('customer', 'name code')
        .populate('supplier', 'name code')
        .populate('lines.product', 'name SKU')
        .populate('lines.warehouse', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      ReturnOrder.countDocuments(query),
    ]);

    res.json({ success: true, data: returns, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const returnOrder = await ReturnOrder.findById(req.params.id)
      .populate('customer')
      .populate('supplier')
      .populate('salesOrder', 'soNumber')
      .populate('purchaseOrder', 'poNumber')
      .populate('lines.product')
      .populate('lines.warehouse');
      
    if (!returnOrder) return res.status(404).json({ success: false, message: 'Return order not found' });
    res.json({ success: true, data: returnOrder });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { type, customer, supplier, salesOrder, purchaseOrder, lines, notes } = req.body;
    
    if (!type || !['inbound', 'outbound'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid return type' });
    }
    
    if (type === 'inbound' && !customer) return res.status(400).json({ success: false, message: 'Customer is required for inbound returns (RMA)' });
    if (type === 'outbound' && !supplier) return res.status(400).json({ success: false, message: 'Supplier is required for outbound returns (RTV)' });
    
    const ref = generateReference(type === 'inbound' ? 'RMA' : 'RTV');
    
    const returnOrder = await ReturnOrder.create({
      reference: ref,
      type,
      customer: type === 'inbound' ? customer : undefined,
      salesOrder: type === 'inbound' ? salesOrder : undefined,
      supplier: type === 'outbound' ? supplier : undefined,
      purchaseOrder: type === 'outbound' ? purchaseOrder : undefined,
      lines: lines || [],
      notes,
      createdBy: req.user._id,
      status: 'draft',
    });
    
    res.status(201).json({ success: true, data: returnOrder });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const returnOrder = await ReturnOrder.findById(req.params.id);
    if (!returnOrder) return res.status(404).json({ success: false, message: 'Return order not found' });
    
    if (['processed', 'cancelled'].includes(returnOrder.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit a processed or cancelled return' });
    }

    const { lines, notes, status } = req.body;
    if (lines) returnOrder.lines = lines;
    if (notes !== undefined) returnOrder.notes = notes;
    
    // Only allow safe status transitions manually (e.g. draft -> pending_inspection)
    if (status && ['draft', 'pending_inspection', 'approved'].includes(status)) {
      returnOrder.status = status;
    }

    await returnOrder.save();
    res.json({ success: true, data: returnOrder });
  } catch (err) {
    next(err);
  }
};

export const processReturn = async (req, res, next) => {
  try {
    const returnOrder = await ReturnOrder.findById(req.params.id);
    if (!returnOrder) return res.status(404).json({ success: false, message: 'Return order not found' });
    
    if (returnOrder.status === 'processed') {
      return res.status(400).json({ success: false, message: 'Return order already processed' });
    }

    // Process Inventory
    for (const line of returnOrder.lines) {
      const product = await Product.findById(line.product);
      if (!product) continue;

      let loc = product.stockLocations.find((l) => l.warehouse.toString() === line.warehouse.toString());
      
      if (returnOrder.type === 'inbound') {
        // RMA: Customer is returning goods TO us. Increment stock.
        if (!loc) {
          product.stockLocations.push({ warehouse: line.warehouse, quantity: line.quantity });
        } else {
          loc.quantity += line.quantity;
        }
        
        await StockLedger.create({
          product: product._id,
          quantity: line.quantity,
          operationType: 'return_in',
          destinationWarehouse: line.warehouse,
          reference: returnOrder.reference,
          user: req.user._id,
        });
        
      } else {
        // RTV: We are returning goods TO supplier. Decrement stock.
        if (!loc || loc.quantity < line.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for product ${product.name} in selected warehouse for RTV.` });
        }
        loc.quantity -= line.quantity;
        
        await StockLedger.create({
          product: product._id,
          quantity: line.quantity,
          operationType: 'return_out',
          sourceWarehouse: line.warehouse,
          reference: returnOrder.reference,
          user: req.user._id,
        });
      }
      
      await product.save();
    }

    returnOrder.status = 'processed';
    returnOrder.processedAt = new Date();
    returnOrder.processedBy = req.user._id;
    await returnOrder.save();

    res.json({ success: true, data: returnOrder });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const returnOrder = await ReturnOrder.findById(req.params.id);
    if (!returnOrder) return res.status(404).json({ success: false, message: 'Return order not found' });
    
    if (returnOrder.status === 'processed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a processed return order' });
    }

    returnOrder.status = 'cancelled';
    await returnOrder.save();
    res.json({ success: true, data: returnOrder });
  } catch (err) {
    next(err);
  }
};
