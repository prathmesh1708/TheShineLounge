// Role-based access control middleware

const adminOnly = (req, res, next) => {
  console.log('--- ADMINONLY MIDDLEWARE CHECK ---', {
    email: req.user?.email,
    role: req.user?.role,
    method: req.method,
    url: req.originalUrl
  });
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin only.'
  });
};

const staffOnly = (req, res, next) => {
  console.log('--- STAFFONLY MIDDLEWARE CHECK ---', {
    email: req.user?.email,
    role: req.user?.role,
    method: req.method,
    url: req.originalUrl
  });
  if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Staff only.'
  });
};

const userOnly = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Customers only.'
  });
};

const hasPermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Admin always has access
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the required permission
    if (req.user.permissions && req.user.permissions.includes(permissionName)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Missing permission: ${permissionName}`
    });
  };
};

module.exports = { adminOnly, staffOnly, userOnly, hasPermission };
