const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const admin = require('../firebase'); // Firebase Admin SDK
const AdminToken = require('../models/AdminToken'); // Stores admin device tokens

const router = express.Router();

/* -------------------------
   GET ALL PRODUCTS
-------------------------- */
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

/* -------------------------
   GET SINGLE PRODUCT
-------------------------- */
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

/* -------------------------
   MULTER STORAGE FIX
-------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

/* -------------------------
   ADD NEW PRODUCT (ADMIN ONLY)
   🔔 Sends push notification to all admins
-------------------------- */
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      let { name, description, price, stock, variants } = req.body;

      let parsedVariants = [];
      if (variants) {
        try { parsedVariants = JSON.parse(variants); } 
        catch (err) { return res.status(400).json({ error: "Invalid JSON format for variants" }); }
      }

      const priceNum = Number(price);
      const stockNum = Number(stock);
      if (isNaN(priceNum) || isNaN(stockNum)) return res.status(400).json({ error: "Price and stock must be valid numbers" });

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const product = new Product({
        name, description, price: priceNum, stock: stockNum, variants: parsedVariants,
        images: imageUrl ? [imageUrl] : []
      });

      await product.save();

      // 🔔 Notify all admin devices
      const tokens = await AdminToken.find().distinct('token');
      if (tokens.length > 0) {
        const message = {
          notification: {
            title: 'New Product Added',
            body: `Product "${product.name}" has been added!`
          },
          tokens
        };
        admin.messaging().sendMulticast(message)
          .then(resp => console.log(`Notification sent to ${resp.successCount} admins`))
          .catch(err => console.error('FCM error:', err));
      }

      res.status(201).json(product);

    } catch (err) {
      console.error("Error creating product:", err);
      res.status(500).json({ error: "Server error while creating product" });
    }
  }
);

/* -------------------------
   UPDATE PRODUCT (ADMIN ONLY)
   🔔 Sends low stock notification if stock <= 5
-------------------------- */
router.put('/:id',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      let updates = { ...req.body };

      if (updates.variants) {
        try { updates.variants = JSON.parse(updates.variants); } 
        catch { return res.status(400).json({ error: "Invalid JSON for variants" }); }
      }

      if (req.file) updates.images = [`/uploads/${req.file.filename}`];

      const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!product) return res.status(404).json({ error: 'Product not found' });

      // 🔔 Low stock check
      const LOW_STOCK_THRESHOLD = 5;
      if (product.stock <= LOW_STOCK_THRESHOLD) {
        const tokens = await AdminToken.find().distinct('token');
        if (tokens.length > 0) {
          const message = {
            notification: {
              title: 'Low Stock Alert',
              body: `Stock for "${product.name}" is low (${product.stock})!`
            },
            tokens
          };
          admin.messaging().sendMulticast(message)
            .then(resp => console.log(`Low stock notification sent to ${resp.successCount} admins`))
            .catch(err => console.error('FCM error:', err));
        }
      }

      res.json(product);

    } catch (err) {
      res.status(500).json({ error: "Error updating product" });
    }
  }
);

/* -------------------------
   DELETE PRODUCT (ADMIN ONLY)
-------------------------- */
router.delete('/:id',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Product deleted' });
    } catch (err) {
      res.status(500).json({ error: "Server error while deleting product" });
    }
  }
);

module.exports = router;
