const mongoose = require('mongoose');

const sslEntrySchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  type: { type: String, enum: ['ssl', 'domain', 'csp', 'ri_ec2', 'ri_rds', 'savings_plan', 'custom'], required: true },
  name: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  source: { type: String, enum: ['aws', 'manual'], default: 'manual' },
  alertDays: [{ type: Number }], // e.g. [7, 14, 30] - alert X days before
  alertEmails: [{ type: String }],
  notes: { type: String },
  autoRenew: { type: Boolean, default: false },
  addedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SSLEntry', sslEntrySchema);
