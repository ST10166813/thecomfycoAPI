const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { authMiddleware } = require('../middleware/authMiddleware');

/* ================================================
   MOCK PAYMENT + CLEAR CART
================================================ */
router.post('/pay', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Here you would integrate real payment:
        // Stripe / PayFast / PayPal

        await Cart.deleteOne({ userId: req.user.userId });

        res.json({
            message: "Payment successful",
            totalPaid: total
        });

    } catch (err) {
        console.error("Payment error:", err);
        res.status(500).json({ error: "Payment failed" });
    }
});

module.exports = router;
