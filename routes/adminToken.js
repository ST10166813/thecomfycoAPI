// routes/adminToken.js
const express = require('express');
const router = express.Router();
const AdminToken = require('../models/AdminToken');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware'); // destructured import

// Route: Register an admin device token
// Protected: Only accessible to authenticated admins
router.post('/register-token', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // Save or update the token for the current admin
        await AdminToken.updateOne(
            { userId: req.user.userId }, // comes from authMiddleware
            { token },
            { upsert: true } // Insert if it doesn't exist
        );

        res.json({ message: 'Token registered successfully' });
    } catch (err) {
        console.error('Error in /register-token:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
