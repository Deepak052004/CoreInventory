import Setting from '../models/Setting.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    const { companyName, companyEmail, companyPhone, companyAddress, currencySymbol, defaultTaxRate } = req.body;

    if (companyName) settings.companyName = companyName;
    if (companyEmail) settings.companyEmail = companyEmail;
    if (companyPhone) settings.companyPhone = companyPhone;
    if (companyAddress) settings.companyAddress = companyAddress;
    if (currencySymbol) settings.currencySymbol = currencySymbol;
    if (defaultTaxRate !== undefined) settings.defaultTaxRate = Number(defaultTaxRate);

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    // The frontend can now access the image at /uploads/filename
    settings.logoUrl = `/uploads/${req.file.filename}`;
    await settings.save();

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};
