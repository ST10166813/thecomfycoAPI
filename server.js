const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User'); 

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 🚀 CORRECT STATIC FILE SERVING MIDDLEWARE 🚀
// The file URL will be accessed via YOUR_DOMAIN/uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/', (req, res) => res.send('🛋️ TheComfyCo API is running!'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/protected', require('./routes/protected'));
app.use('/api/products', require('./routes/products'));
 

// Seed admin function (Function remains the same)
async function seedAdmin() {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash('Admin123!', 10); 
      await User.create({
        name: 'Super Admin',
        email: 'admin@thecomfyco.com',
        password: hashed,
        role: 'admin'
      });
      console.log("✅ Admin account created: admin@thecomfyco.com");
    } else {
      console.log("ℹ️ Admin already exists, skipping seeding.");
    }
  } catch (err) {
    console.error("❌ Failed to seed admin:", err.message);
  }
}

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Call seeding function
    await seedAdmin();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('❌ DB connection failed:', err.message));