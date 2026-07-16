// Middleware specific to CarDetailing service
const validateCarDetailingBooking = (req, res, next) => {
  const { customerName, dateTime } = req.body;
  if (!customerName || !dateTime) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: customerName and dateTime are required.'
    });
  }
  next();
};

module.exports = {
  validateCarDetailingBooking
};
