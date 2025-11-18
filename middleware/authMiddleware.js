// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware: Authenticate user via JWT
 * Checks for 'Authorization' header and verifies token.
 * Adds decoded user info to req.user if valid.
 */
function authMiddleware(req, res, next) {
  try {
    // Expecting header: Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied: No token provided' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ error: 'Access denied: Token missing' });
    }

    // Verify JWT token using secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request

    next(); // Pass to next middleware or route
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: Restrict access to admin users only
 * Requires authMiddleware to run first
 */
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin
  } else {
    return res.status(403).json({ error: 'Access forbidden: Admin required' });
  }
};

// Export both middlewares
module.exports = { authMiddleware, adminMiddleware };
