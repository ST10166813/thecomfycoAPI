const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // { userId, role }
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
}

const adminMiddleware = (req, res, next) => {
    // Assuming authMiddleware has already set req.user
    if (req.user && req.user.role === 'admin') {
        next(); // User is admin, proceed
    } else {
        // 🔑 FIX: Explicitly return JSON 403 (Forbidden)
        return res.status(403).json({ error: 'Access forbidden: Admin required.' });
    }
};

module.exports = adminMiddleware;

module.exports = { authMiddleware, adminMiddleware };
