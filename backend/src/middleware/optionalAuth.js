const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { JWT_SECRET } = require('../common/config/env');

// For endpoints that genuinely accept guests but must still recognise a signed-in
// caller — feedback submission is the case here. Without it, feedback submitted
// by a logged-in customer was stored with `userId: null`, so `GET /my-feedback`
// could only find it again by trusting an email supplied in the query string.
// That query parameter was the leak: anyone could read anyone's tickets.
//
// A bad or expired token is treated exactly like no token at all. This
// middleware never rejects; use `authMiddleware` when the request must be
// authenticated.
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer')) {
      return next();
    }

    const token = header.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, JWT_SECRET);

    let user = await User.findById(decoded.userId);
    if (!user) {
      user = await Admin.findById(decoded.userId);
    }

    if (user && user.isActive && !user.isDeleted) {
      req.user = user;
    }
  } catch (error) {
    // Anonymous request; the route decides what a guest may do.
  }
  return next();
};

module.exports = optionalAuth;
