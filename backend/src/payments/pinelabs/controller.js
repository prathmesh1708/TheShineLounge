const service = require('./service');

// HTTP surface for the card terminal. The POS calls initiate once, polls
// status until it settles, and may cancel while it is still open.

const fail = (res, error) => {
  const status = error?.status || 500;
  res.status(status).json({ success: false, message: error?.message || 'Pine Labs payment failed.' });
};

// @desc    Whether the POS should offer the Pine Labs button, and where
// @route   GET /api/payments/pinelabs/status
// @access  Private (Staff/Admin)
const getStatus = async (req, res) => {
  try {
    res.status(200).json({ success: true, ...service.status() });
  } catch (error) {
    // A misconfigured terminal map must not take the POS down: say it is off.
    res.status(200).json({ success: true, enabled: false, dryRun: false, departments: [], message: error.message });
  }
};

// @desc    Push an amount onto the department's terminal
// @route   POST /api/payments/pinelabs/initiate
// @access  Private (Staff/Admin)
const initiate = async (req, res) => {
  try {
    const b = req.body || {};
    const payment = await service.initiate({
      amount: b.amount,
      source: b.source,
      departmentKey: b.departmentKey,
      staffId: req.user?._id || '',
      staffName: b.staffName || req.user?.fullName || '',
      customerName: b.customerName,
      phone: b.phone,
      vehicleNo: b.vehicleNo
    });
    res.status(201).json({ success: true, payment });
  } catch (error) {
    fail(res, error);
  }
};

// @desc    What the terminal did with a pushed bill
// @route   GET /api/payments/pinelabs/:txnRef
// @access  Private (Staff/Admin)
const getTransaction = async (req, res) => {
  try {
    const payment = await service.checkStatus(req.params.txnRef);
    res.status(200).json({ success: true, payment });
  } catch (error) {
    fail(res, error);
  }
};

// @desc    Take an unpaid bill back off the terminal
// @route   POST /api/payments/pinelabs/:txnRef/cancel
// @access  Private (Staff/Admin)
const cancel = async (req, res) => {
  try {
    const payment = await service.cancel(req.params.txnRef);
    res.status(200).json({ success: true, payment });
  } catch (error) {
    fail(res, error);
  }
};

// @desc    Card attempts, including the ones that never became a sale
// @route   GET /api/payments/pinelabs
// @access  Private (Admin)
const list = async (req, res) => {
  try {
    const result = await service.list(req.query || {});
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    fail(res, error);
  }
};

module.exports = { getStatus, initiate, getTransaction, cancel, list };
