const mongoose = require('mongoose');

const auditReportSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  type: { 
    type: String, 
    enum: ['security', 'cost', 'inventory', 'vulnerability', 'patching', 'ssl', 'monthly'],
    required: true 
  },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
  summary: { type: mongoose.Schema.Types.Mixed },
  findings: [{ type: mongoose.Schema.Types.Mixed }],
  recommendations: [{ type: mongoose.Schema.Types.Mixed }],
  htmlReport: { type: String },
  excelData: { type: mongoose.Schema.Types.Mixed },
  triggeredBy: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditReport', auditReportSchema);
