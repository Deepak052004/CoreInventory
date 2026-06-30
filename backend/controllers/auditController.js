import AuditLog from '../models/AuditLog.js';

/**
 * Controller to fetch system audit logs for administrative viewing.
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      action,
      resource,
      status,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
      ];
    }

    if (action) filter.action = action;
    if (resource) filter.resource = resource;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    // Also get distinct resources and actions for frontend filters
    const [resources, actions] = await Promise.all([
      AuditLog.distinct('resource'),
      AuditLog.distinct('action'),
    ]);

    return res.json({
      success: true,
      data: logs,
      filters: { resources, actions },
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};
