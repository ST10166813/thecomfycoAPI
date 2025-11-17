const mongoose = require('mongoose');

const adminTokenSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    token: { type: String, required: true }
});

module.exports = mongoose.model('AdminToken', adminTokenSchema);
