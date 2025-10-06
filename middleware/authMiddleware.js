const jwt = require('jsonwebtoken');

// Middleware to verify and authenticate a user using JWT
function authMiddleware(req, res, next) {
  // Extract token from the 'Authorization' header (expected format: 'Bearer <token>')
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    // Verify the token using the secret key stored in environment variables
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the decoded user information (e.g. userId, role) to the request object
    req.user = verified;
    next(); // Continue to the next middleware or route handler
  } catch (err) {
    // Token verification failed or token is invalid
    res.status(400).json({ error: 'Invalid token' });
  }
}

// Middleware to restrict access to admin users only
const adminMiddleware = (req, res, next) => {
  // Ensure the user is authenticated and has the admin role
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, continue
  } else {
    // User is not authorized to access this route
    return res.status(403).json({ error: 'Access forbidden: Admin required.' });
  }
};

// Export both middlewares for use in other files
module.exports = { authMiddleware, adminMiddleware };
