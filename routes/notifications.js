const express = require('express');
const admin = require('../firebase'); // Firebase initialized
const AdminToken = require('../models/AdminToken');

const router = express.Router();

router.post('/send-notification', async (req, res) => {
  const { userId, title, body } = req.body;

  try {
    const user = await AdminToken.findOne({ userId });
    if (!user || !user.token) {
      return res.status(404).json({ error: "User token not found" });
    }

    await admin.messaging().send({
      token: user.token,
      notification: { title, body }
    });

    res.json({ success: true, message: "Notification sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
