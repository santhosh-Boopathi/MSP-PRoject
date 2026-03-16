const mongoose = require('mongoose');

const clientTaskSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  clientName: { type: String },
  taskType: {
    type: String,
    enum: ['patching', 'security_audit', 'cost_report', 'monthly_report', 'ssl_renewal', 'ri_renewal', 'vulnerability_scan', 'backup_check', 'custom'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'overdue'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  dueDate: { type: Date },
  lastDoneDate: { type: Date },
  nextDueDate: { type: Date },
  frequencyDays: { type: Number },
  assignedTo: { type: String },
  assignedToName: { type: String },
  completedBy: { type: String },
  completedAt: { type: Date },
  notes: { type: String },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

clientTaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  // Auto-mark overdue
  if (this.dueDate && new Date(this.dueDate) < new Date() && this.status === 'pending') {
    this.status = 'overdue';
  }
  next();
});

module.exports = mongoose.model('ClientTask', clientTaskSchema);
