const Invoice = require('../models/Invoice');
const { nextSequentialId } = require('../utils/sequentialId');

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// @desc    Save a POS invoice
// @route   POST /api/invoices
// @access  Private (Staff/Admin)
const createInvoice = async (req, res) => {
  try {
    const b = req.body || {};
    const items = (Array.isArray(b.items) ? b.items : [])
      .filter((i) => i && i.name)
      .map((i) => ({ name: String(i.name), price: num(i.price), qty: Math.max(1, num(i.qty) || 1) }));

    if (!String(b.customerName || '').trim()) {
      return res.status(400).json({ success: false, message: 'Customer is required.' });
    }
    if (items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required.' });
    }

    const year = new Date().getFullYear();
    const fields = {
      customerId: String(b.customerId || ''),
      customerName: String(b.customerName).trim(),
      customerEmail: b.customerEmail || '',
      phone: b.phone || '',
      vehicleNo: String(b.vehicleNo || '').toUpperCase().trim(),
      department: b.department || '',
      departmentKey: b.departmentKey || '',
      sacCode: b.sacCode || '',
      items,
      subtotal: num(b.subtotal),
      discount: num(b.discount),
      taxableAmount: num(b.taxableAmount),
      includeGst: Boolean(b.includeGst),
      gstRate: num(b.gstRate),
      taxType: b.taxType === 'igst' ? 'igst' : 'split',
      gst: num(b.gst),
      cgst: num(b.cgst),
      sgst: num(b.sgst),
      igst: num(b.igst),
      total: num(b.total),
      paymentMethod: b.paymentMethod || 'UPI',
      staffId: String(req.user?._id || ''),
      staffName: b.staffName || req.user?.fullName || ''
    };

    // Sequential number; retry if two staff save at the same instant.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const invoiceNo = await nextSequentialId(Invoice, { field: 'invoiceNo', prefix: `INV-${year}-`, pad: 4 });
      try {
        const invoice = await Invoice.create({ ...fields, invoiceNo });
        return res.status(201).json({ success: true, invoice });
      } catch (err) {
        if (err && err.code === 11000) continue;
        throw err;
      }
    }
    return res.status(409).json({ success: false, message: 'Could not allocate an invoice number, please retry.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to save invoice.' });
  }
};

// @desc    Attach the issued warranty number to an invoice
// @route   PATCH /api/invoices/:invoiceNo/warranty
// @access  Private (Staff/Admin)
const setInvoiceWarranty = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { invoiceNo: req.params.invoiceNo },
      { $set: { warrantyNo: String(req.body?.warrantyNo || '') } },
      { returnDocument: 'after' }
    );
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update invoice.' });
  }
};

// @desc    List invoices (newest first)
// @route   GET /api/invoices
// @access  Private (Staff/Admin)
const getInvoices = async (req, res) => {
  try {
    const { customerId, page = 1, limit = 50 } = req.query;
    const query = { isDeleted: { $ne: true } };
    if (customerId) query.customerId = String(customerId);
    const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * lim;
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      Invoice.countDocuments(query)
    ]);
    res.status(200).json({ success: true, total, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch invoices.' });
  }
};

module.exports = { createInvoice, getInvoices, setInvoiceWarranty };
