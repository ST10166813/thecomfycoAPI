const express = require('express');
const router = express.Router();
const admin = require('../src/firebase');
const AdminToken = require('../models/AdminToken');

// Send notifications to ALL admins
router.post('/send-notification', async (req, res) => {
    try {
        const { title, body } = req.body;

        if (!title || !body) {
            return res.status(400).json({ error: "Title and body required" });
        }

        // Fetch all admin tokens
        const admins = await AdminToken.find({});
        const tokens = admins.map(a => a.token);

        console.log("📌 Tokens found:", tokens);

        if (tokens.length === 0) {
            return res.status(200).json({ success: false, message: "No admin tokens found" });
        }

        // Firebase v11+ uses sendEachForDevices()
        const message = {
            tokens,
            notification: { title, body }
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        console.log("📨 Notification Response:", response);

        res.json({
            success: true,
            sent: response.successCount,
            failed: response.failureCount
        });
    } catch (err) {
        console.error("Notification error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
