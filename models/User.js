const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  resetCode: { type: String, default: null },
  resetCodeExpiry: { type: Date, default: null }
});

module.exports = mongoose.model('User', UserSchema);
