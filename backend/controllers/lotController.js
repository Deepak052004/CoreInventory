import Lot from '../models/Lot.js';

export const getAll = async (req, res, next) => {
  try {
    const { search, product, warehouse, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.identifier = new RegExp(search, 'i');
    if (product) query.product = product;
    if (warehouse) query.warehouse = warehouse;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [lots, total] = await Promise.all([
      Lot.find(query)
        .populate('product', 'name SKU trackingType unitOfMeasure')
        .populate('warehouse', 'name code')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Lot.countDocuments(query),
    ]);

    res.json({ success: true, data: lots, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const lot = await Lot.findById(req.params.id)
      .populate('product', 'name SKU trackingType unitOfMeasure')
      .populate('warehouse', 'name code');
      
    if (!lot) return res.status(404).json({ success: false, message: 'Lot not found' });
    res.json({ success: true, data: lot });
  } catch (err) {
    next(err);
  }
};
