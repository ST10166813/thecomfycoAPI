const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/authMiddleware');

/* ================================================
   ADD ITEM TO CART
================================================ */
router.post('/cart/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity, price, name, image } = req.body;
    const userId = req.user.userId;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(i => i.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, price, name, image });
    }

    await cart.save();
    res.json({ message: 'Item added to cart', cart });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart' });
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
