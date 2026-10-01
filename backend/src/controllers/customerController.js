const Customer = require('../models/Customer');
const RegisteredVehicle = require('../models/RegisteredVehicle');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { tryUpsertRegisteredVehicle } = require('../services/vehicleRegistry');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public (or Admin)
exports.getAllCustomers = async (req, res) => {
  try {
    const [customers, vehicles] = await Promise.all([
      Customer.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean(),
      RegisteredVehicle.find({ isDeleted: { $ne: true } }).lean()
    ]);

    const customerList = customers.map(c => {
      const cEmail = (c.email || '').toLowerCase().trim();
      const cPhone = String(c.mobile || '').replace(/\D/g, '').slice(-10);
      const cId = c.customerId;

      const matchedVehicles = vehicles.filter(v => {
        const vCustId = v.customerId;
        const vEmail = (v.ownerEmail || '').toLowerCase().trim();
        const vPhone = String(v.ownerPhone || '').replace(/\D/g, '').slice(-10);
        return (cId && vCustId === cId) || (cEmail && vEmail === cEmail) || (cPhone && vPhone === cPhone);
      });

      const rawVehicles = matchedVehicles.map(v => ({
        id: v._id || v.vehicleId || v.plateNumber,
        plateNumber: v.plateNumber,
        registrationNumber: v.plateNumber,
        brand: v.brand || '',
        model: v.model || '',
        category: v.category || 'Car',
        year: v.year || ''
      }));

      const vehicleStrings = rawVehicles.map(v => {
        const label = [v.brand, v.model].filter(Boolean).join(' ');
        return `${v.plateNumber}${label ? ` (${label})` : ''}`;
      });

      return {
        ...c,
        vehicles: vehicleStrings,
        rawVehicles
      };
    });

    res.status(200).json({
      success: true,
      count: customerList.length,
      data: customerList
    });
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
  }
};

// @desc    Get single customer by customerId or _id
// @route   GET /api/customers/:id
// @access  Public
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    let customer = await Customer.findOne({ customerId: id });
    if (!customer && id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer', error: error.message });
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Public
exports.createCustomer = async (req, res) => {
  try {
    const fullName = req.body.fullName || req.body.name;
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : '';
    const mobile = req.body.mobile || req.body.phone || '';
    const city = req.body.city || 'Gurgaon';
    const segment = req.body.segment || 'Regular Customer';
    const vehicles = Array.isArray(req.body.vehicles) ? req.body.vehicles : [];

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Customer full name is required' });
    }

    // Auto-generate customerId if not provided
    const customerId = req.body.customerId || `CUST-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const customer = await Customer.create({
      customerId,
      fullName,
      email: email || undefined,
      mobile,
      city,
      segment
    });

    // Register vehicles if provided
    const vehicleObjs = [];
    for (const v of vehicles) {
      const plate = typeof v === 'string' ? v : (v.registrationNumber || v.plateNumber);
      if (plate) {
        const cleanPlate = String(plate).toUpperCase().trim();
        const brand = (typeof v === 'object' && v.brand) || '';
        const model = (typeof v === 'object' && v.model) || '';
        const category = (typeof v === 'object' && v.category) || 'Car';

        await tryUpsertRegisteredVehicle({
          plateNumber: cleanPlate,
          brand,
          model,
          category,
          ownerName: fullName,
          ownerEmail: email,
          ownerPhone: mobile,
          customerId,
          addedVia: 'staff'
        });

        vehicleObjs.push({
          plateNumber: cleanPlate,
          brand,
          model,
          category
        });
      }
    }

    // Sync to User collection for backwards compatibility
    try {
      let userQuery = [];
      if (email) userQuery.push({ email });
      if (mobile) userQuery.push({ mobile });

      let existingUser = userQuery.length > 0 ? await User.findOne({ $or: userQuery, isDeleted: { $ne: true } }) : null;
      if (!existingUser) {
        const tempPass = await bcrypt.hash('Customer@123', 10);
        await User.create({
          fullName,
          email: email || undefined,
          mobile,
          password: tempPass,
          role: 'user',
          city,
          vehicles: vehicleObjs.map(vo => ({
            plateNumber: vo.plateNumber,
            brand: vo.brand,
            model: vo.model,
            category: vo.category,
            addedVia: 'staff'
          }))
        });
      } else if (vehicleObjs.length > 0) {
        for (const vo of vehicleObjs) {
          const hasVeh = (existingUser.vehicles || []).some(v => v.plateNumber === vo.plateNumber);
          if (!hasVeh) {
            existingUser.vehicles.push({
              plateNumber: vo.plateNumber,
              brand: vo.brand,
              model: vo.model,
              category: vo.category,
              addedVia: 'staff'
            });
          }
        }
        await existingUser.save();
      }
    } catch (syncErr) {
      console.warn('Could not sync customer to User model:', syncErr.message);
    }

    const customerObj = customer.toObject ? customer.toObject() : { ...customer };
    customerObj.vehicles = vehicleObjs.map(v => `${v.plateNumber}${v.brand || v.model ? ` (${[v.brand, v.model].filter(Boolean).join(' ')})` : ''}`);
    customerObj.rawVehicles = vehicleObjs;

    res.status(201).json({ success: true, data: customerObj });
  } catch (error) {
    console.error('Error in createCustomer:', error);
    res.status(400).json({ success: false, message: 'Failed to create customer', error: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    let customer = await Customer.findOne({ customerId: id });
    if (!customer && id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    Object.assign(customer, req.body);
    await customer.save();

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    res.status(400).json({ success: false, message: 'Failed to update customer', error: error.message });
  }
};

// @desc    Soft delete customer
// @route   DELETE /api/customers/:id
// @access  Public
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    let customer = await Customer.findOne({ customerId: id });
    if (!customer && id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await Customer.findById(id);
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.isDeleted = true;
    await customer.save();

    // Soft delete in User collection too if matching
    if (customer.email || customer.mobile) {
      const q = [];
      if (customer.email) q.push({ email: customer.email.toLowerCase() });
      if (customer.mobile) q.push({ mobile: customer.mobile });
      if (q.length > 0) {
        await User.updateMany({ $or: q }, { $set: { isDeleted: true } });
      }
    }

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({ success: false, message: 'Failed to delete customer', error: error.message });
  }
};
