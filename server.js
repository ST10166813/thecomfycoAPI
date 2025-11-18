const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const adminTokenRoutes = require('./routes/adminToken');
const notificationsRoute = require('./routes/notifications');

const app = express();

// Use the port Render provides, fallback to 5000 for local
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check / default route
app.get('/', (req, res) => res.send('🛋️ TheComfyCo API is running!'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/protected', require('./routes/protected'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', adminTokenRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/payment', require('./routes/payment'));

// Create admin if missing
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
      console.log("Admin account created: admin@thecomfyco.com");
    } else {
      console.log("ℹ Admin already exists.");
    }
  } catch (err) {
    console.error("Failed to seed admin:", err.message);
  }
}

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('Connected to MongoDB');

    await seedAdmin();

    // Bind to all network interfaces for Render
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('DB connection failed:', err.message));
