const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/authMiddleware');

/* ================================================
   ADD ITEM TO CART
================================================ */
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: "Product not found" });

        let cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart) {
            cart = new Cart({
                userId: req.user.userId,
                items: []
            });
        }

        const existing = cart.items.find(i => i.productId === productId);

        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.items.push({
                productId,
                name: product.name,
                price: product.price,
                image: product.images[0],
                quantity
            });
        }

        cart.updatedAt = new Date();
        await cart.save();

        res.json({ message: "Added to cart", cart });
    } catch (err) {
        console.error("Add to cart error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

/* ================================================
   GET USER CART
================================================ */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });
        res.json(cart || { items: [] });
    } catch (err) {
        res.status(500).json({ error: "Failed to load cart" });
    }
});

/* ================================================
   REMOVE A PRODUCT FROM CART
================================================ */
router.delete('/remove/:productId', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });
        if (!cart) return res.status(404).json({ error: "Cart not found" });

        cart.items = cart.items.filter(i => i.productId !== req.params.productId);
        await cart.save();

        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: "Failed to remove item" });
    }
});

/* ================================================
   CLEAR CART AFTER PAYMENT
================================================ */
router.delete('/clear', authMiddleware, async (req, res) => {
    try {
        await Cart.deleteOne({ userId: req.user.userId });
        res.json({ message: "Cart cleared" });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear cart" });
    }
});

module.exports = router;
