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

// Who may manage other staff members' records: admins, plus department
// managers and staff holding a staff/orders/bookings permission. Exported so
// controllers can apply the same rule to per-action checks.
const isStaffManager = (user) => {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  const dept = String(user.department || '').toLowerCase();

  // Super Admins, Admins, and Managers have full staff onboarding control
  if (role === 'admin' || role === 'superadmin' || role === 'manager') return true;

  // Department managers and staff with staff/admin permissions
  return role === 'staff' && (
    user.permissions?.includes('staff') ||
    user.permissions?.includes('orders') ||
    user.permissions?.includes('bookings') ||
    dept === 'management' ||
    dept === 'manager'
  );
};

const canManageStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (isStaffManager(req.user)) {
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

module.exports = { adminOnly, staffOnly, userOnly, hasPermission, canManageStaff, isStaffManager };
