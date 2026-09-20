// Role-based access control middleware

const adminOnly = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (role === 'admin' || role === 'superadmin' || role === 'manager') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin only.'
  });
};

const staffOnly = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (role === 'staff' || role === 'admin' || role === 'superadmin' || role === 'manager') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Staff only.'
  });
};

const canManageStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  const role = String(req.user.role || '').toLowerCase();
  const dept = String(req.user.department || '').toLowerCase();

  // Super Admins, Admins, and Managers have full staff onboarding control
  if (role === 'admin' || role === 'superadmin' || role === 'manager') {
    return next();
  }

  // Department managers and staff with staff/admin permissions
  if (
    role === 'staff' &&
    (req.user.permissions?.includes('staff') ||
     req.user.permissions?.includes('orders') ||
     req.user.permissions?.includes('bookings') ||
     dept === 'management' ||
     dept === 'manager')
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin only.'
  });
};

const userOnly = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (role === 'user') {
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

    const role = String(req.user.role || '').toLowerCase();
    // Admin always has access
    if (role === 'admin' || role === 'superadmin') {
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

module.exports = { adminOnly, staffOnly, userOnly, hasPermission, canManageStaff };
