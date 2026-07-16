const validateSalonStaff = (req, res, next) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed: name, email, and phone are required for staff.'
    });
  }
  next();
};

module.exports = {
  validateSalonStaff
};
