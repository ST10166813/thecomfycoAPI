const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const admin = require('../src/firebase'); 
const AdminToken = require('../models/AdminToken');

const router = express.Router();

/* ======================================================
   GET ALL PRODUCTS
====================================================== */
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

/* ======================================================
   GET SINGLE PRODUCT
====================================================== */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/* ======================================================
   MULTER IMAGE STORAGE
====================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

/* ======================================================
   ADD NEW PRODUCT + PUSH NOTIFICATION
====================================================== */
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
        try {
          parsedVariants = JSON.parse(variants);
        } catch {
          return res.status(400).json({ error: "Invalid JSON format for variants" });
        }
      }

      const priceNum = Number(price);
      const stockNum = Number(stock);

      if (isNaN(priceNum) || isNaN(stockNum))
        return res.status(400).json({ error: "Price and stock must be valid numbers" });

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const product = new Product({
        name,
        description,
        price: priceNum,
        stock: stockNum,
        variants: parsedVariants,
        images: imageUrl ? [imageUrl] : []
      });

      await product.save();

      /* ------------------ SEND PUSH NOTIFICATION ------------------ */
try {
  const tokens = await AdminToken.find().distinct('token');

  if (tokens.length > 0) {

    const response = await admin.messaging().sendEach(
      tokens.map(token => ({
        token,
        notification: {
          title: 'New Product Added',
          body: `Product "${product.name}" has been added!`
        }
      }))
    );

    console.log(`Notification sent to ${response.successCount} admins`);
  } else {
    console.log("No admin tokens found.");
  }

} catch (notifErr) {
  console.error("Notification error (ignored):", notifErr);
}


/* ======================================================
   UPDATE PRODUCT + LOW STOCK WARNING
====================================================== */
router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      let updates = { ...req.body };

      if (updates.variants) {
        try {
          updates.variants = JSON.parse(updates.variants);
        } catch {
          return res.status(400).json({ error: "Invalid JSON for variants" });
        }
      }

      if (req.file) {
        updates.images = [`/uploads/${req.file.filename}`];
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      );
      if (!product) return res.status(404).json({ error: 'Product not found' });

      // ------------------ LOW STOCK PUSH NOTIFICATION ------------------
      try {
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

          const response = await admin.messaging().sendEach(
  tokens.map(token => ({
    token,
    notification: {
      title: 'Low Stock Alert',
      body: `Stock for "${product.name}" is low (${product.stock})!`
    }
  }))
);

            console.log(`Low stock notifications sent: ${response.successCount}`);
          } else {
            console.log("No admin tokens found for low stock alert.");
          }
        }
      } catch (lowErr) {
        console.error("Low stock notification error:", lowErr);
      }

      res.json(product);

    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ error: "Error updating product" });
    }
  }
);

module.exports = router;
