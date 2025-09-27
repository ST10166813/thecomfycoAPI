const express = require('express');
const Product = require('../models/Product');
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

// Create product (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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
