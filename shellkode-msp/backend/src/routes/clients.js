const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Client = require('../models/Client');
const Activity = require('../models/Activity');
const ClientTask = require('../models/ClientTask');
const SSLEntry = require('../models/SSLEntry');
const { AlertConfig, Note } = require('../models/AlertNote');

const ADMIN_EMAIL = 'santhosh.b@shellkode.com'; // Only this user can modify

// ── Seed clients ──────────────────────────────────────────────────────────────
const seedClients = async () => {
  const count = await Client.countDocuments();
  if (count === 0) {
    const clients = [
      { name: 'PAYNEARBY', team: 'Cronos', industry: 'FinTech', status: 'active', awsRegions: ['ap-south-1'], contactName: 'Operations Team', contactEmail: 'ops@paynearby.in', domains: ['paynearby.in', 'api.paynearby.in'] },
      { name: 'VANAN SERVICES', team: 'Cronos', industry: 'IT Services', status: 'active', awsRegions: ['ap-south-1', 'us-east-1'], contactEmail: 'tech@vananservices.com', domains: ['vananservices.com'] },
      { name: 'NARAYANA NETHRALAYA', team: 'Cronos', industry: 'Healthcare', status: 'active', awsRegions: ['ap-south-1'], contactEmail: 'it@narayananethralaya.com', domains: ['narayananethralaya.com'] },
      { name: 'BOTREE', team: 'Cronos', industry: 'Technology', status: 'active', awsRegions: ['ap-south-1'], domains: ['botreesoftware.com'] },
      { name: 'FINNEVA', team: 'Cronos', industry: 'FinTech', status: 'active', awsRegions: ['ap-south-1'], domains: ['finneva.in'] },
      { name: 'LUCAS TVS', team: 'Cronos', industry: 'Manufacturing', status: 'active', awsRegions: ['ap-south-1'], domains: ['lucastvs.com'] },
      { name: '5C NETWORK', team: 'Cronos', industry: 'Healthcare Tech', status: 'active', awsRegions: ['ap-south-1', 'ap-southeast-1'], domains: ['5cnetwork.com'] },
      { name: 'UWC', team: 'Cronos', industry: 'Education', status: 'active', awsRegions: ['ap-south-1'], domains: ['uwc.edu.in'] },
      { name: 'BIOVUS', team: 'Cronos', industry: 'BioTech', status: 'active', awsRegions: ['ap-south-1'], domains: ['biovus.com'] },
      { name: 'ZETAPP', team: 'Cronos', industry: 'FinTech', status: 'active', awsRegions: ['ap-south-1'], domains: ['zetapp.in'] },
      { name: 'GRAYQUEST', team: 'Cronos', industry: 'EdTech FinTech', status: 'active', awsRegions: ['ap-south-1'], domains: ['grayquest.com'] },
      { name: 'SBFC', team: 'Cronos', industry: 'NBFC / Finance', status: 'active', awsRegions: ['ap-south-1', 'ap-south-2'], domains: ['sbfc.com'] },
    ];
    await Client.insertMany(clients);
    console.log('✅ Seeded 12 Cronos clients');
  }
};
seedClients();

// ── GET all clients ───────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { team } = req.query;
    const query = team ? { team } : {};
    const clients = await Client.find(query).select('-awsCredentials -awsAccounts.secretAccessKey');
    res.json(clients);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET single client ─────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-awsCredentials -awsAccounts.secretAccessKey');
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST create client (admin only) ──────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Only Santhosh can add clients' });
  try {
    const client = new Client({ ...req.body, team: 'Cronos' });
    await client.save();
    await Activity.create({ clientId: client._id, clientName: client.name, action: 'New client added: ' + client.name, category: 'client', severity: 'success', performedBy: req.user.email, performedByName: req.user.name });
    res.status(201).json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT update client (admin only) ───────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Only Santhosh can edit clients' });
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    await Activity.create({ clientId: client._id, clientName: client.name, action: 'Client updated: ' + client.name, category: 'client', severity: 'info', performedBy: req.user.email, performedByName: req.user.name });
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE client (admin only) ────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'Only Santhosh can delete clients' });
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    await Client.findByIdAndDelete(req.params.id);
    await Activity.create({ clientName: client.name, action: 'Client deleted: ' + client.name, category: 'client', severity: 'warning', performedBy: req.user.email, performedByName: req.user.name });
    res.json({ success: true, message: client.name + ' deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST save AWS credentials ─────────────────────────────────────────────────
router.post('/:id/credentials', authMiddleware, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, regions, accounts } = req.body;
    const updateData = { awsRegions: regions || ['ap-south-1'] };
    if (accessKeyId) {
      updateData['awsCredentials.accessKeyId'] = accessKeyId;
      if (secretAccessKey) updateData['awsCredentials.secretAccessKey'] = secretAccessKey;
    }
    if (accounts && accounts.length > 0) {
      updateData.awsAccounts = accounts;
      updateData.awsAccountId = accounts[0].accountId || '';
    }
    const client = await Client.findByIdAndUpdate(req.params.id, updateData, { new: true });
    await Activity.create({ clientId: client._id, clientName: client.name, action: 'AWS credentials updated', category: 'credentials', severity: 'success', performedBy: req.user.email, performedByName: req.user.name, details: (accounts ? accounts.length : 1) + ' account(s) configured · ' + (regions || ['ap-south-1']).join(', ') });
    res.json({ success: true, message: 'Credentials saved', accountCount: accounts ? accounts.length : 1 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TASKS ─────────────────────────────────────────────────────────────────────
router.get('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await ClientTask.find({ clientId: req.params.id }).sort({ status: 1, dueDate: 1 });
    // Auto-update overdue
    for (const t of tasks) {
      if (t.dueDate && new Date(t.dueDate) < new Date() && t.status === 'pending') {
        t.status = 'overdue'; await t.save();
      }
    }
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    const task = new ClientTask({ ...req.body, clientId: req.params.id, clientName: client?.name, createdBy: req.user.email });
    await task.save();
    await Activity.create({ clientId: req.params.id, clientName: client?.name, action: 'Task added: ' + task.title, category: 'client', severity: 'info', performedBy: req.user.email, performedByName: req.user.name });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const task = await ClientTask.findByIdAndUpdate(req.params.taskId, { ...req.body, updatedAt: new Date() }, { new: true });
    if (req.body.status === 'completed') {
      await Activity.create({ clientId: req.params.id, clientName: task.clientName, action: 'Task completed: ' + task.title, category: 'client', severity: 'success', performedBy: req.user.email, performedByName: req.user.name });
    }
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    await ClientTask.findByIdAndDelete(req.params.taskId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── NOTES ─────────────────────────────────────────────────────────────────────
router.get('/:id/notes', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ clientId: req.params.id }).sort({ pinned: -1, createdAt: -1 });
    res.json(notes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/notes', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    const note = new Note({ ...req.body, clientId: req.params.id, createdBy: req.user.email, createdByName: req.user.name });
    await note.save();
    await Activity.create({ clientId: req.params.id, clientName: client?.name, action: 'Note added: ' + note.title, category: 'note', severity: note.priority === 'critical' ? 'critical' : 'info', performedBy: req.user.email, performedByName: req.user.name, details: note.content.slice(0, 80) });
    res.status(201).json(note);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/notes/:noteId', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.noteId, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(note);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/notes/:noteId', authMiddleware, async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.noteId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ALERTS ────────────────────────────────────────────────────────────────────
router.get('/:id/alerts', authMiddleware, async (req, res) => {
  try {
    const alerts = await AlertConfig.find({ clientId: req.params.id });
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/alerts', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    const alert = new AlertConfig({ ...req.body, clientId: req.params.id, createdBy: req.user.email });
    await alert.save();
    await Activity.create({ clientId: req.params.id, clientName: client?.name, action: 'Alert configured: ' + req.body.type, category: 'alert', severity: 'info', performedBy: req.user.email, performedByName: req.user.name, details: 'Email: ' + req.body.email + ' · ' + req.body.thresholdDays + ' days threshold' });
    res.status(201).json(alert);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/alerts/:alertId', authMiddleware, async (req, res) => {
  try {
    const alert = await AlertConfig.findByIdAndUpdate(req.params.alertId, req.body, { new: true });
    res.json(alert);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/alerts/:alertId', authMiddleware, async (req, res) => {
  try {
    await AlertConfig.findByIdAndDelete(req.params.alertId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── SSL ENTRIES (manual + AWS) ────────────────────────────────────────────────
router.get('/:id/ssl-entries', authMiddleware, async (req, res) => {
  try {
    const entries = await SSLEntry.find({ clientId: req.params.id }).sort({ expiryDate: 1 });
    res.json(entries);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/ssl-entries', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    const entry = new SSLEntry({ ...req.body, clientId: req.params.id, addedBy: req.user.email });
    await entry.save();
    const daysLeft = Math.floor((new Date(entry.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    await Activity.create({ clientId: req.params.id, clientName: client?.name, action: 'SSL/Expiry entry added: ' + entry.name, category: 'ssl', severity: daysLeft < 30 ? 'warning' : 'info', performedBy: req.user.email, performedByName: req.user.name, details: 'Type: ' + entry.type + ' · Expires: ' + new Date(entry.expiryDate).toLocaleDateString('en-IN') + ' · ' + daysLeft + ' days left' });
    res.status(201).json(entry);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/ssl-entries/:entryId', authMiddleware, async (req, res) => {
  try {
    const entry = await SSLEntry.findByIdAndUpdate(req.params.entryId, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(entry);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id/ssl-entries/:entryId', authMiddleware, async (req, res) => {
  try {
    await SSLEntry.findByIdAndDelete(req.params.entryId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ALL TASKS (for client report sidebar) ────────────────────────────────────
router.get('/all/tasks-summary', authMiddleware, async (req, res) => {
  try {
    const tasks = await ClientTask.find({ team: 'Cronos' }).sort({ status: 1, dueDate: 1 });
    const byClient = {};
    for (const t of tasks) {
      const key = t.clientId?.toString();
      if (!byClient[key]) byClient[key] = { clientId: key, clientName: t.clientName, tasks: [] };
      byClient[key].tasks.push(t);
    }
    res.json(Object.values(byClient));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
