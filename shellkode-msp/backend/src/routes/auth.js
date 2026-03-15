const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'shellkode.com';

// Team Cronos members seed data
const TEAM_CRONOS = [
  { name: 'Subha', fullName: 'Subhasubalakshmi S', email: 'subhasubalakshmi.s@shellkode.com', phone: '9043173878', role: 'engineer' },
  { name: 'Raghul', fullName: 'Raghul', email: 'raghul.sasikumar@shellkode.com', phone: '7904350313', role: 'engineer' },
  { name: 'Santhosh', fullName: 'Santhosh B', email: 'santhosh.b@shellkode.com', phone: '8526407704', role: 'engineer' },
  { name: 'Bhavesh', fullName: 'Bhavesh K', email: 'bhavesh.k@shellkode.com', phone: '8890569447', role: 'engineer' },
  { name: 'Surya', fullName: 'Surya Krishna', email: 'surya.krishna@shellkode.com', phone: '7013195007', role: 'engineer' },
  { name: 'Gokul', fullName: 'Gokul A', email: 'gokul.a@shellkode.com', phone: '8838390568', role: 'engineer' },
  { name: 'Arunachalam', fullName: 'Arunachalam G', email: 'arunachalam.g@shellkode.com', phone: '6381220655', role: 'engineer' },
  { name: 'Hemanath', fullName: 'Hemanath U', email: 'hemanath.u@shellkode.com', phone: '7448787737', role: 'engineer' },
  { name: 'Lavanya', fullName: 'Lavanya K', email: 'lavanya.k@shellkode.com', phone: '9344933152', role: 'engineer' },
  { name: 'Pradeep', fullName: 'Pradeep P', email: 'pradeep.p@shellkode.com', phone: '9186838466', role: 'engineer' },
  { name: 'Hari', fullName: 'Hari Prasath J', email: 'hariprasath.j@shellkode.com', phone: '7806808943', role: 'engineer' },
];

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const domain = email.split('@')[1];
    
    if (domain !== ALLOWED_DOMAIN) {
      return res.status(403).json({ 
        error: `Access restricted to @${ALLOWED_DOMAIN} accounts only` 
      });
    }
    
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        name: payload.name,
        picture: payload.picture,
        googleId: payload.sub,
        team: 'Cronos'
      });
      // Set phone from team data
      const teamMember = TEAM_CRONOS.find(m => m.email === email);
      if (teamMember) user.phone = teamMember.phone;
      await user.save();
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, team: user.team },
      process.env.JWT_SECRET || 'shellkode_secret',
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, picture: user.picture, team: user.team } });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Demo login (development only)
router.post('/demo', async (req, res) => {
  try {
    const { email } = req.body;
    const domain = email?.split('@')[1];
    
    if (domain !== ALLOWED_DOMAIN) {
      return res.status(403).json({ error: `Access restricted to @${ALLOWED_DOMAIN} accounts only` });
    }
    
    let user = await User.findOne({ email });
    if (!user) {
      const teamMember = TEAM_CRONOS.find(m => m.email === email);
      user = new User({
        email,
        name: teamMember?.fullName || email.split('@')[0],
        phone: teamMember?.phone,
        team: 'Cronos',
        role: teamMember?.role || 'engineer'
      });
      await user.save();
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, team: user.team },
      process.env.JWT_SECRET || 'shellkode_secret',
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, team: user.team } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shellkode_secret');
    const user = await User.findById(decoded.userId).select('-awsCredentials');
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
