import Product from '../models/Product.js';
import DeliveryOrder from '../models/DeliveryOrder.js';
import Receipt from '../models/Receipt.js';

export const getAlerts = async (req, res, next) => {
  try {
    const [lowStock, outOfStock, pendingDeliveries] = await Promise.all([
      Product.find({ $expr: { $gt: ['$reorderLevel', '$stockQuantity'] }, stockQuantity: { $gt: 0 } })
        .select('name SKU stockQuantity reorderLevel')
        .populate('category', 'name')
        .limit(20),
      Product.find({ $or: [{ stockQuantity: 0 }, { stockQuantity: { $exists: false } }] })
        .select('name SKU')
        .populate('category', 'name')
        .limit(20),
      DeliveryOrder.find({ status: { $in: ['draft', 'waiting', 'ready'] } })
        .select('reference customer status createdAt')
        .sort('-createdAt')
        .limit(10),
    ]);
    res.json({
      success: true,
      data: {
        lowStock,
        outOfStock,
        pendingDeliveries,
      },
    });
  } catch (err) {
    next(err);
  }
};
