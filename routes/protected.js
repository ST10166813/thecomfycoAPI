const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

// Authenticated route
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: `Welcome, ${req.user.userId}`, role: req.user.role });
});

// Admin route
router.post('/admin/task', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: 'Admin task executed!' });
});

module.exports = router;
