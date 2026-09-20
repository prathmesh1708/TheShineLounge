const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public (or Admin)
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
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
    const { fullName, email, mobile, city, segment } = req.body;
    
    // Auto-generate customerId if not provided
    const customerId = req.body.customerId || `CUST-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const customer = await Customer.create({
      customerId,
      fullName,
      email,
      mobile,
      city: city || 'Mumbai',
      segment: segment || 'Regular Customer'
    });

    res.status(201).json({ success: true, data: customer });
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

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    res.status(500).json({ success: false, message: 'Failed to delete customer', error: error.message });
  }
};
