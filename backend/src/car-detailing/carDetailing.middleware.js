// Middleware specific to CarDetailing service
const validateCarDetailingBooking = (req, res, next) => {
  const { customerName } = req.body;
  if (!customerName) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: customerName is required.'
    });
  }
  next();
};

module.exports = {
  validateCarDetailingBooking
};
