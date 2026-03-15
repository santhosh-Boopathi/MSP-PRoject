const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  clientName: { type: String },
  action: { type: String, required: true },
  category: { type: String, enum: ['security', 'cost', 'patching', 'ssl', 'inventory', 'credentials', 'client', 'user', 'ticket', 'report', 'note', 'alert'], default: 'client' },
  details: { type: String },
  performedBy: { type: String },
  performedByName: { type: String },
  severity: { type: String, enum: ['info', 'warning', 'success', 'critical'], default: 'info' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);
