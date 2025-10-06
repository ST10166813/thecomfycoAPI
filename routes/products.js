const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Fetch all products
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Fetch a single product by ID
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');

    // Create uploads folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique name (timestamp + original file extension)
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Add a new product (admin only)
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  async (req, res) => {
    try {
      let { name, description, price, stock, variants } = req.body;

      // Convert variant data from string to array if needed
      let parsedVariants = [];
      if (variants) {
        try {
          parsedVariants = JSON.parse(variants);
        } catch (err) {
          console.error("Invalid JSON for variants:", err);
          return res.status(400).json({ error: "Invalid JSON format for variants." });
        }
      }

      // Ensure price and stock are numbers
      const priceNum = Number(price);
      const stockNum = Number(stock);

      if (isNaN(priceNum) || isNaN(stockNum)) {
        return res.status(400).json({ error: "Price and stock must be numbers" });
      }

      // Handle uploaded image
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
      console.error("Error creating product:", err);
      res.status(500).json({ error: "Server error while creating product" });
    }
  }
);

// Update product details (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Remove a product (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deleted' });
});

module.exports = router;
