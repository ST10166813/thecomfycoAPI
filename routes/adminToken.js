const express = require('express');
const AdminToken = require('../models/AdminToken');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/save-device-token', authMiddleware, adminMiddleware, async (req, res) => {
    const { token } = req.body;
    const userId = req.user.userId;

    if (!token) return res.status(400).json({ error: "Token required" });

    try {
        await AdminToken.updateOne(
            { userId },
            { token },
            { upsert: true }
        );
        res.json({ message: "Token saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
