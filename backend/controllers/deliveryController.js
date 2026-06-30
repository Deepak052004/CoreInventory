import DeliveryOrder from '../models/DeliveryOrder.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import SalesOrder from '../models/SalesOrder.js';
import Lot from '../models/Lot.js';
import { generateReference } from '../utils/generateReference.js';
import { sendLowStockAlert } from '../utils/emailService.js';

export const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [deliveries, total] = await Promise.all([
      DeliveryOrder.find(query).populate('lines.product').populate('lines.warehouse').populate('customer', 'name code').populate('salesOrder', 'soNumber').sort('-createdAt').skip(skip).limit(Number(limit)),
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
      .populate('lines.warehouse')
      .populate('customer', 'name code email')
      .populate('salesOrder', 'soNumber');
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
      salesOrder: req.body.salesOrder || null,
      customer: req.body.customer,
      lines: req.body.lines || [],
      status: 'draft',
      createdBy: req.user._id,
    });
    const populated = await DeliveryOrder.findById(delivery._id).populate('lines.product').populate('lines.warehouse').populate('customer', 'name').populate('salesOrder', 'soNumber');
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
    const populated = await DeliveryOrder.findById(delivery._id).populate('lines.product').populate('lines.warehouse').populate('customer', 'name').populate('salesOrder', 'soNumber');
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
    
    // Process Inventory
    for (const line of delivery.lines) {
      const product = await Product.findById(line.product);
      if (!product) continue;
      
      if (product.trackingType === 'batch' || product.trackingType === 'serial') {
        if (!line.lotIdentifier) {
          return res.status(400).json({ success: false, message: `Product ${product.name} requires a batch/serial number for outbound delivery.` });
        }
        
        let lot = await Lot.findOne({ product: product._id, identifier: line.lotIdentifier.toUpperCase(), warehouse: line.warehouse });
        if (!lot) {
          return res.status(400).json({ success: false, message: `Batch/Serial ${line.lotIdentifier} not found in selected warehouse for product ${product.name}.` });
        }
        
        if (lot.quantity < line.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient quantity in Batch/Serial ${line.lotIdentifier} for product ${product.name}.` });
        }
        
        lot.quantity -= line.quantity;
        if (lot.quantity === 0) lot.status = 'depleted';
        await lot.save();
      }

      let loc = product.stockLocations.find((l) => l.warehouse.toString() === line.warehouse.toString());
      
      const locEntry = product.stockLocations?.find((s) => s.warehouse?.toString() === line.warehouse._id.toString());
      const currentAtLoc = locEntry ? (locEntry.quantity || 0) : 0;
      
      if (currentAtLoc < line.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name} at selected warehouse. Available: ${currentAtLoc}, Requested: ${line.quantity}` 
        });
      }
      
      locEntry.quantity -= line.quantity;
      await product.save();
      
      // Check if this deduction pushed stock below reorder level
      if (product.totalStock <= (product.reorderLevel || 0)) {
        sendLowStockAlert(product).catch(err => console.error('Email Error:', err));
      }

      await StockLedger.create({
        product: product._id,
        quantity: -line.quantity,
        operationType: 'delivery',
        sourceWarehouse: line.warehouse._id,
        reference: delivery.reference,
        user: req.user._id,
      });
    }
    delivery.status = 'done';
    delivery.validatedAt = new Date();
    delivery.validatedBy = req.user._id;
    await delivery.save();
    
    // Sync status back to SalesOrder if linked
    if (delivery.salesOrder) {
      const so = await SalesOrder.findById(delivery.salesOrder);
      if (so) {
        // Increment delivered quantities
        for (const line of delivery.lines) {
          const soItem = so.items.find(i => i.product.toString() === line.product._id.toString());
          if (soItem) {
            soItem.deliveredQty = (soItem.deliveredQty || 0) + line.quantity;
          }
        }
        
        const isFullyDelivered = so.items.every(i => (i.deliveredQty || 0) >= (i.requestedQty || 0));
        const isPartiallyDelivered = so.items.some(i => (i.deliveredQty || 0) > 0);
        
        if (isFullyDelivered) {
          so.status = 'completed';
        } else if (isPartiallyDelivered) {
          so.status = 'partial';
        }
        await so.save();
      }
    }

    const populated = await DeliveryOrder.findById(delivery._id).populate('lines.product').populate('lines.warehouse').populate('customer', 'name').populate('salesOrder', 'soNumber');
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
