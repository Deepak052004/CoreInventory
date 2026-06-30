import Receipt from '../models/Receipt.js';
import Product from '../models/Product.js';
import StockLedger from '../models/StockLedger.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Lot from '../models/Lot.js';
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
      purchaseOrder: req.body.purchaseOrder || null,
      supplier: req.body.supplier,
      lines: req.body.lines || [],
      status: 'draft',
      createdBy: req.user._id,
    });
    const populated = await Receipt.findById(receipt._id).populate('lines.product').populate('lines.warehouse').populate('purchaseOrder', 'poNumber');
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
    // Process Inventory
    for (const line of receipt.lines) {
      const product = await Product.findById(line.product);
      if (!product) continue;
      
      if (product.trackingType === 'batch' || product.trackingType === 'serial') {
        if (!line.lotIdentifier) {
          return res.status(400).json({ success: false, message: `Product ${product.name} requires a batch/serial number.` });
        }
        if (product.trackingType === 'serial' && line.quantity !== 1) {
          return res.status(400).json({ success: false, message: `Product ${product.name} is serial-tracked. Quantity per serial must be exactly 1.` });
        }
        
        let lot = await Lot.findOne({ product: product._id, identifier: line.lotIdentifier.toUpperCase() });
        if (lot && product.trackingType === 'serial') {
          return res.status(400).json({ success: false, message: `Serial Number ${line.lotIdentifier} already exists for product ${product.name}.` });
        }
        
        if (!lot) {
          lot = await Lot.create({
            product: product._id,
            warehouse: line.warehouse,
            identifier: line.lotIdentifier.toUpperCase(),
            quantity: line.quantity,
            expiryDate: line.expiryDate,
          });
        } else {
          lot.quantity += line.quantity;
          if (line.expiryDate) lot.expiryDate = line.expiryDate;
          if (lot.status === 'depleted') lot.status = 'active';
          await lot.save();
        }
      }
      
      // Update new stockLocations structure from M4
      let locEntry = product.stockLocations?.find(
        (s) => s.warehouse?.toString() === line.warehouse._id.toString()
      );
      
      if (!locEntry) {
        product.stockLocations = product.stockLocations || [];
        product.stockLocations.push({
          warehouse: line.warehouse._id,
          quantity: line.quantity,
          minStockLevel: 0
        });
      } else {
        locEntry.quantity = (locEntry.quantity || 0) + line.quantity;
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

    // If linked to a PO, update the PO received quantities and status
    if (receipt.purchaseOrder) {
      const po = await PurchaseOrder.findById(receipt.purchaseOrder);
      if (po) {
        // Increment received quantities
        for (const line of receipt.lines) {
          const poItem = po.items.find(i => i.product.toString() === line.product._id.toString());
          if (poItem) {
            poItem.receivedQty = (poItem.receivedQty || 0) + line.quantity;
          }
        }
        
        // Evaluate overall status
        const isFullyReceived = po.items.every(i => (i.receivedQty || 0) >= (i.requestedQty || 0));
        const isPartiallyReceived = po.items.some(i => (i.receivedQty || 0) > 0);
        
        if (isFullyReceived) {
          po.status = 'completed';
        } else if (isPartiallyReceived) {
          po.status = 'partial';
        }
        await po.save();
      }
    }

    const populated = await Receipt.findById(receipt._id).populate('lines.product').populate('lines.warehouse').populate('purchaseOrder', 'poNumber');
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
