const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order'); // ✅ make sure this model exists
const { authMiddleware } = require('../middleware/authMiddleware');

/* ================================================
   MOCK PAYMENT + CREATE ORDER + CLEAR CART
================================================ */
router.post('/pay', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // ✅ Create new order
        const newOrder = new Order({
            userId: req.user.userId,
            items: cart.items,
            status: "packing", // default status
            createdAt: new Date()
        });

        await newOrder.save();

        // ✅ Clear cart
        await Cart.deleteOne({ userId: req.user.userId });

        res.json({
            message: "Payment successful",
            totalPaid: total,
            orderId: newOrder._id
        });

    } catch (err) {
        console.error("Payment error:", err);
        res.status(500).json({ error: "Payment failed" });
    }
});

module.exports = router;
