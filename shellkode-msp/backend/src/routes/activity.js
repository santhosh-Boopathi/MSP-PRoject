const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Activity = require('../models/Activity');
const { AlertConfig, Note } = require('../models/AlertNote');

// ─── ACTIVITY LOG ────────────────────────────────────────────────────────────

// GET all recent activity (dashboard)
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const clientId = req.query.clientId;
    const query = clientId ? { clientId } : {};
    const activities = await Activity.find(query).sort({ createdAt: -1 }).limit(limit);
    res.json(activities);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST log activity
router.post('/activity', authMiddleware, async (req, res) => {
  try {
    const act = new Activity({ ...req.body, performedBy: req.user.email, performedByName: req.user.name });
    await act.save();
    res.status(201).json(act);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ALERT CONFIG ────────────────────────────────────────────────────────────

router.get('/alerts/:clientId', authMiddleware, async (req, res) => {
  try {
    const alerts = await AlertConfig.find({ clientId: req.params.clientId });
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/alerts', authMiddleware, async (req, res) => {
  try {
    const alert = new AlertConfig({ ...req.body, createdBy: req.user.email });
    await alert.save();
    // Log activity
    await Activity.create({ clientId: req.body.clientId, clientName: req.body.clientName, action: 'Alert configured: ' + req.body.type, category: 'alert', details: 'Alert email: ' + req.body.email + ' · Threshold: ' + req.body.thresholdDays + ' days', performedBy: req.user.email, performedByName: req.user.name, severity: 'info' });
    res.status(201).json(alert);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/alerts/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await AlertConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(alert);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/alerts/:id', authMiddleware, async (req, res) => {
  try {
    await AlertConfig.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── NOTES ───────────────────────────────────────────────────────────────────

router.get('/notes/:clientId', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ clientId: req.params.clientId }).sort({ pinned: -1, createdAt: -1 });
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notes', authMiddleware, async (req, res) => {
  try {
    const note = new Note({ ...req.body, createdBy: req.user.email, createdByName: req.user.name });
    await note.save();
    await Activity.create({ clientId: req.body.clientId, clientName: req.body.clientName, action: 'Note added: ' + req.body.title, category: 'note', details: req.body.content.slice(0, 100), performedBy: req.user.email, performedByName: req.user.name, severity: req.body.priority === 'critical' ? 'critical' : 'info' });
    res.status(201).json(note);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(note);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/notes/:id', authMiddleware, async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
