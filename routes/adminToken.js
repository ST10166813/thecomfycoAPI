const express = require('express');
const router = express.Router();
const AdminToken = require('../models/AdminToken');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.post('/register-token', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: "Token required" });
        }

        await AdminToken.updateOne(
            { userId: req.user.userId },
            { token },
            { upsert: true }
        );

        res.json({ message: "Admin token saved" });
    } catch (err) {
        console.error("Token Register Error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
