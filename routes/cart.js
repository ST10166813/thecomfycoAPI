// const express = require('express');
// const router = express.Router();
// const Cart = require('../models/Cart');
// const Product = require('../models/Product');
// const { authMiddleware } = require('../middleware/authMiddleware');

// /* ================================================
//    ADD ITEM TO CART
// ================================================ */
// router.post('/cart/add', authMiddleware, async (req, res) => {
//   try {
//     const { productId, quantity } = req.body;
//     const userId = req.user.userId;

//     // ✅ Fetch product details from DB
//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     let cart = await Cart.findOne({ userId });
//     if (!cart) {
//       cart = new Cart({ userId, items: [] });
//     }

//     // ✅ Update quantity if product already exists
//     const existingItem = cart.items.find(i => i.productId.toString() === productId);
//     if (existingItem) {
//       existingItem.quantity += quantity;
//     } else {
//       cart.items.push({
//         productId,
//         quantity,
//         price: product.price,
//         name: product.name,
//         image: product.images?.[0] || null
//       });
//     }

//     await cart.save();
//     res.json({ message: 'Item added to cart', cart });
//   } catch (err) {
//     console.error("Add to cart error:", err);
//     res.status(500).json({ error: 'Failed to add to cart' });
//   }
// });

// /* ================================================
//    GET USER CART
// ================================================ */
// router.get('/', authMiddleware, async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ userId: req.user.userId });
//     res.json(cart || { items: [] });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to load cart" });
//   }
// });

// /* ================================================
//    REMOVE A PRODUCT FROM CART
// ================================================ */
// router.delete('/remove/:productId', authMiddleware, async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ userId: req.user.userId });
//     if (!cart) return res.status(404).json({ error: "Cart not found" });

//     cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
//     await cart.save();

//     res.json(cart);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to remove item" });
//   }
// });

// /* ================================================
//    CLEAR CART AFTER PAYMENT
// ================================================ */
// router.delete('/clear', authMiddleware, async (req, res) => {
//   try {
//     await Cart.deleteOne({ userId: req.user.userId });
//     res.json({ message: "Cart cleared" });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to clear cart" });
//   }
// });

// router.use((req, res) => {
//   console.log("Unmatched cart route:", req.method, req.originalUrl);
//   res.status(400).send("Bad Request from cart router");
// });

// module.exports = router;

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
    const userId = req.user.userId;

    // ✅ Fetch product details from DB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // ✅ Update quantity if product already exists
    const existingItem = cart.items.find(i => i.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        name: product.name,
        image: product.images?.[0] || null
      });
    }

    await cart.save();
    res.json({ message: 'Item added to cart', cart });
  } catch (err) {
    console.error("Add to cart error:", err);
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

    cart.items = cart.items.filter(i => i.productId.toString() !== req.params.productId);
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

// (Optional) make this a 404 JSON instead of generic 400 HTML
router.use((req, res) => {
  console.log("Unmatched cart route:", req.method, req.originalUrl);
  res.status(404).json({ error: "Cart route not found" });
});

module.exports = router;
 