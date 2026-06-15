import StockLedger from '../models/StockLedger.js';

export const getAll = async (req, res, next) => {
  try {
    const { product, operationType, warehouse, page = 1, limit = 50 } = req.query;
    const query = {};
    if (product) query.product = product;
    if (operationType) query.operationType = operationType;
    if (warehouse) {
      query.$or = [
        { sourceWarehouse: warehouse },
        { destinationWarehouse: warehouse },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [movements, total] = await Promise.all([
      StockLedger.find(query)
        .populate('product')
        .populate('sourceWarehouse')
        .populate('destinationWarehouse')
        .populate('user', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      StockLedger.countDocuments(query),
    ]);
    res.json({ success: true, data: movements, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};
