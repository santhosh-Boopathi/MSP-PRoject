const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const AuditReport = require('../models/AuditReport');

router.get('/:clientId', authMiddleware, async (req, res) => {
  try {
    const reports = await AuditReport.find({ clientId: req.params.clientId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const report = new AuditReport({ ...req.body, triggeredBy: req.user.email });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
