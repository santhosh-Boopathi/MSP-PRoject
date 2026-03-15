const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

// Mock Freshdesk data (replace with real API calls)
const getMockTickets = () => ({
  summary: {
    total: 147,
    open: 23,
    resolved: 89,
    closed: 28,
    customerActionPending: 12,
    shellkodeActionPending: 18,
    pending: 7
  },
  trend: [
    { week: 'Week 1', opened: 12, resolved: 10, closed: 5 },
    { week: 'Week 2', opened: 18, resolved: 15, closed: 8 },
    { week: 'Week 3', opened: 9, resolved: 12, closed: 6 },
    { week: 'Week 4', opened: 14, resolved: 11, closed: 9 },
  ],
  byPriority: [
    { priority: 'Urgent', count: 5 },
    { priority: 'High', count: 12 },
    { priority: 'Medium', count: 38 },
    { priority: 'Low', count: 92 },
  ],
  byClient: [
    { client: 'PAYNEARBY', open: 3, resolved: 12, closed: 5 },
    { client: 'VANAN SERVICES', open: 2, resolved: 8, closed: 3 },
    { client: 'NARAYANA NETHRALAYA', open: 4, resolved: 15, closed: 6 },
    { client: 'BOTREE', open: 1, resolved: 6, closed: 2 },
    { client: 'FINNEVA', open: 5, resolved: 10, closed: 4 },
    { client: 'LUCAS TVS', open: 2, resolved: 9, closed: 3 },
    { client: '5C NETWORK', open: 3, resolved: 11, closed: 3 },
    { client: 'UWC', open: 1, resolved: 7, closed: 2 },
    { client: 'BIOVUS', open: 0, resolved: 4, closed: 2 },
    { client: 'ZETAPP', open: 2, resolved: 5, closed: 1 },
    { client: 'GRAYQUEST', open: 0, resolved: 2, closed: 1 },
    { client: 'SBFC', open: 0, resolved: 0, closed: 0 },
  ],
  recentTickets: [
    { id: 'TKT-1234', subject: 'EC2 instance CPU spike alert', client: 'PAYNEARBY', status: 'open', priority: 'High', assignee: 'Raghul', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'TKT-1233', subject: 'RDS backup failure notification', client: 'NARAYANA NETHRALAYA', status: 'customer_action_pending', priority: 'Medium', assignee: 'Santhosh', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'TKT-1232', subject: 'SSL certificate renewal required', client: 'FINNEVA', status: 'resolved', priority: 'Urgent', assignee: 'Surya', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { id: 'TKT-1231', subject: 'Cost anomaly detected in S3', client: '5C NETWORK', status: 'shellkode_action_pending', priority: 'High', assignee: 'Gokul', createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
    { id: 'TKT-1230', subject: 'New security group rule request', client: 'BOTREE', status: 'closed', priority: 'Low', assignee: 'Hemanath', createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
  ]
});

// GET ticket summary for team Cronos
router.get('/tickets', authMiddleware, (req, res) => {
  try {
    res.json(getMockTickets());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tickets from real Freshdesk API
router.get('/tickets/live', authMiddleware, async (req, res) => {
  try {
    const { FRESHDESK_DOMAIN, FRESHDESK_API_KEY } = process.env;
    if (!FRESHDESK_DOMAIN || !FRESHDESK_API_KEY) {
      return res.json(getMockTickets());
    }
    
    const response = await axios.get(`https://${FRESHDESK_DOMAIN}/api/v2/tickets?per_page=100`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${FRESHDESK_API_KEY}:X`).toString('base64')}`
      }
    });
    
    res.json({ tickets: response.data });
  } catch (err) {
    // Fallback to mock on error
    res.json(getMockTickets());
  }
});

module.exports = router;
