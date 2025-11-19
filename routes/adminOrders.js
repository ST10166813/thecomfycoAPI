const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // make sure this model exists
const { authMiddleware } = require('../middleware/authMiddleware');

// GET all orders (admin only)
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// UPDATE order status
router.put('/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    await order.save();

    res.json({ message: "Order updated", order });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

module.exports = router;
