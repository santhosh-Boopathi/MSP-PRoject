const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const awsRoutes = require('./routes/aws');
const freshdeskRoutes = require('./routes/freshdesk');
const reportsRoutes = require('./routes/reports');
const teamRoutes = require('./routes/team');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/shellkode_msp';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/aws', awsRoutes);
app.use('/api/freshdesk', freshdeskRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/team', teamRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'ShellKode MSP Portal API', team: 'Cronos' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('ShellKode MSP Backend running on port ' + PORT);
});

module.exports = app;
```

Commit → Railway redeploys → then visit `https://msp-project-production.up.railway.app/` and you should see the JSON response.

Then add to your **frontend Variables**:
```
REACT_APP_API_URL = https://msp-project-production.up.railway.app
