// routes/adminToken.js
const express = require('express');
const router = express.Router();
const AdminToken = require('../models/AdminToken');
const authMiddleware = require('../middleware/authMiddleware'); // must decode JWT

router.post('/register-token', authMiddleware, async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token is required' });

        // Save token for this admin
        await AdminToken.updateOne(
            { userId: req.user.userId }, // comes from authMiddleware
            { token },
            { upsert: true }
        );

        res.json({ message: 'Token registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
