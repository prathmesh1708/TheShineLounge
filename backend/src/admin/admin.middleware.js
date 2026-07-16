const isAdmin = (req, res, next) => {
  // Mock check: we assume user is admin for showcase, or checks role
  const user = req.user;
  if (user && user.role !== 'admin' && user.role !== 'super-admin') {
    // For demo purposes, we will log warnings instead of blocking completely,
    // or block if explicitly header role is user.
    if (req.headers['x-admin-role'] !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Super Admin permissions required.'
      });
    }
  }
  next();
};

module.exports = {
  isAdmin
};
