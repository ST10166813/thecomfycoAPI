const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const path = require('path');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Get product by ID
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 🔑 FIX: Use absolute path. Assumes 'products.js' is in 'routes/' 
    cb(null, path.join(__dirname, '..', 'uploads')); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create product (admin only, with image upload)
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      let { name, description, price, stock, variants } = req.body;

      // Parse variants if string
     // ...
      // Parse variants if string
      let parsedVariants = [];
      if (variants) {
        try {
          parsedVariants = JSON.parse(variants);
} catch (err) {
  console.error("❌ Invalid JSON format for variants:", err);
  // 🔑 FIX: MUST return here to stop execution
  return res.status(400).json({ error: "Invalid JSON format for variants." }); 
}

      }
// ...

      // Ensure numeric values
      const priceNum = Number(price);
      const stockNum = Number(stock);

      if (isNaN(priceNum) || isNaN(stockNum)) {
        return res.status(400).json({ error: "Price and stock must be numbers" });
      }

      // Image
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
      res.status(201).json(product);
    } catch (err) {
      console.error("❌ Error in createProduct:", err);
      res.status(500).json({ error: "Server error while creating product" });
    }
  }
);

// Update product (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Delete product (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deleted' });
});

module.exports = router;
