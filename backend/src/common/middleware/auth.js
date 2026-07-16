// Mock Authentication Middleware
const authMiddleware = (req, res, next) => {
  // Check authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Return unauthorized for demo purposes, or default to mock user if mock header present
    console.log('No token provided, using guest mode');
    req.user = { id: 'guest-id', role: 'guest' };
    return next();
  }
  
  // Fake token verification
  req.user = { id: 'mock-user-id', role: 'user' };
  next();
};

module.exports = authMiddleware;
