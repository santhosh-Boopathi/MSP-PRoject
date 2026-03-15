const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: String, default: 'Cronos' },
  awsAccountId: { type: String },
  awsRegions: [{ type: String }],
  awsCredentials: {
    accessKeyId: { type: String },
    secretAccessKey: { type: String },
    // Note: In production, encrypt these with KMS or use AWS Secrets Manager
  },
  contactName: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  industry: { type: String },
  onboardedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive', 'onboarding'], default: 'active' },
  logo: { type: String },
  domains: [{ type: String }],
  freshdeskCompanyId: { type: String },
  lastAuditDate: { type: Date },
  lastCostReportDate: { type: Date },
  lastPatchDate: { type: Date },
  notes: { type: String },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

clientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Client', clientSchema);
