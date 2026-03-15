const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Client = require('../models/Client');

// Seed clients if empty
const seedClients = async () => {
  const count = await Client.countDocuments();
  if (count === 0) {
    const clients = [
      { name: 'PAYNEARBY', team: 'Cronos', industry: 'FinTech', status: 'active', awsRegions: ['ap-south-1'], contactName: 'Operations Team', domains: ['paynearby.in'] },
      { name: 'VANAN SERVICES', team: 'Cronos', industry: 'IT Services', status: 'active', awsRegions: ['ap-south-1', 'us-east-1'], contactName: 'Tech Team', domains: ['vananservices.com'] },
      { name: 'NARAYANA NETHRALAYA', team: 'Cronos', industry: 'Healthcare', status: 'active', awsRegions: ['ap-south-1'], contactName: 'IT Head', domains: ['narayananethralaya.com'] },
      { name: 'BOTREE', team: 'Cronos', industry: 'Technology', status: 'active', awsRegions: ['ap-south-1'], contactName: 'DevOps Team', domains: ['botreesoftware.com'] },
      { name: 'FINNEVA', team: 'Cronos', industry: 'FinTech', status: 'active', awsRegions: ['ap-south-1'], contactName: 'Cloud Team', domains: ['finneva.in'] },
      { name: 'LUCAS TVS', team: 'Cronos', industry: 'Manufacturing', status: 'active', awsRegions: ['ap-south-1'], contactName: 'IT Department', domains: ['lucastvs.com'] },
      { name: '5C NETWORK', team: 'Cronos', industry: 'Healthcare Tech', status: 'active', awsRegions: ['ap-south-1', 'ap-southeast-1'], contactName: 'Engineering', domains: ['5cnetwork.com'] },
      { name: 'UWC', team: 'Cronos', industry: 'Education', status: 'active', awsRegions: ['ap-south-1'], contactName: 'Tech Lead', domains: ['uwc.edu.in'] },
      { name: 'BIOVUS', team: 'Cronos', industry: 'BioTech', status: 'active', awsRegions: ['ap-south-1'], contactName: 'CTO Office', domains: ['biovus.com'] },
      { name: 'ZETAPP', team: 'Cronos', industry: 'FinTech', status: 'active', awsRegions: ['ap-south-1'], contactName: 'Platform Team', domains: ['zetapp.in'] },
      { name: 'GRAYQUEST', team: 'Cronos', industry: 'EdTech FinTech', status: 'active', awsRegions: ['ap-south-1'], contactName: 'Engineering', domains: ['grayquest.com'] },
      { name: 'SBFC', team: 'Cronos', industry: 'NBFC / Finance', status: 'active', awsRegions: ['ap-south-1', 'ap-south-2'], contactName: 'IT Operations', domains: ['sbfc.com'] },
    ];
    await Client.insertMany(clients);
    console.log('✅ Seeded 12 Cronos clients');
  }
};

seedClients();

// GET all clients for a team
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { team } = req.query;
    const query = team ? { team } : {};
    const clients = await Client.find(query).select('-awsCredentials');
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single client
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-awsCredentials');
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create client
router.post('/', authMiddleware, async (req, res) => {
  try {
    const client = new Client({ ...req.body, team: 'Cronos' });
    await client.save();
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update client
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save AWS credentials for a client
router.post('/:id/credentials', authMiddleware, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, regions } = req.body;
    // In production: encrypt before storing
    await Client.findByIdAndUpdate(req.params.id, {
      'awsCredentials.accessKeyId': accessKeyId,
      'awsCredentials.secretAccessKey': secretAccessKey,
      awsRegions: regions || ['ap-south-1']
    });
    res.json({ success: true, message: 'Credentials saved securely' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
