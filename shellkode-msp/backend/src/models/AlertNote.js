const mongoose = require('mongoose');

const alertConfigSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  email: { type: String, required: true },
  type: { type: String, enum: ['ssl_expiry', 'domain_expiry', 'ri_expiry', 'savings_plan_expiry', 'cost_anomaly', 'security_critical', 'patch_due'], required: true },
  thresholdDays: { type: Number, default: 30 },
  enabled: { type: Boolean, default: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const noteSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  createdBy: { type: String },
  createdByName: { type: String },
  pinned: { type: Boolean, default: false },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  AlertConfig: mongoose.model('AlertConfig', alertConfigSchema),
  Note: mongoose.model('Note', noteSchema)
};
