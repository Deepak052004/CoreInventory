import Warehouse from '../models/Warehouse.js';

export const getAll = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().populate('managers', 'name email').sort({ name: 1 });
    res.json({ success: true, data: warehouses });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate('managers', 'name email');
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, data: warehouse });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, data: warehouse });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, message: 'Warehouse deleted' });
  } catch (err) {
    next(err);
  }
};
