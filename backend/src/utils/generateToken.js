const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../common/config/env');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = generateToken;
