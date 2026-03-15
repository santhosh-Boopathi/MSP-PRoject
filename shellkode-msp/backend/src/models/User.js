const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  picture: { type: String },
  role: { type: String, enum: ['admin', 'engineer', 'viewer'], default: 'engineer' },
  team: { type: String, default: 'Cronos' },
  googleId: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
