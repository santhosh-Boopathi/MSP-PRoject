const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const TEAMS = [
  {
    id: 'cronos',
    name: 'Cronos',
    description: 'Team A - AWS Managed Services',
    members: [
      { name: 'Subha', fullName: 'Subhasubalakshmi S', email: 'subhasubalakshmi.s@shellkode.com', phone: '9043173878', role: 'Cloud Engineer', avatar: 'SU' },
      { name: 'Raghul', fullName: 'Raghul Sasikumar', email: 'raghul.sasikumar@shellkode.com', phone: '7904350313', role: 'Cloud Engineer', avatar: 'RA' },
      { name: 'Santhosh', fullName: 'Santhosh B', email: 'santhosh.b@shellkode.com', phone: '8526407704', role: 'Cloud Engineer', avatar: 'SA' },
      { name: 'Bhavesh', fullName: 'Bhavesh K', email: 'bhavesh.k@shellkode.com', phone: '8890569447', role: 'Cloud Engineer', avatar: 'BH' },
      { name: 'Surya', fullName: 'Surya Krishna', email: 'surya.krishna@shellkode.com', phone: '7013195007', role: 'Cloud Engineer', avatar: 'SK' },
      { name: 'Gokul', fullName: 'Gokul A', email: 'gokul.a@shellkode.com', phone: '8838390568', role: 'Cloud Engineer', avatar: 'GO' },
      { name: 'Arunachalam', fullName: 'Arunachalam G', email: 'arunachalam.g@shellkode.com', phone: '6381220655', role: 'Cloud Engineer', avatar: 'AR' },
      { name: 'Hemanath', fullName: 'Hemanath U', email: 'hemanath.u@shellkode.com', phone: '7448787737', role: 'Cloud Engineer', avatar: 'HE' },
      { name: 'Lavanya', fullName: 'Lavanya K', email: 'lavanya.k@shellkode.com', phone: '9344933152', role: 'Cloud Engineer', avatar: 'LA' },
      { name: 'Pradeep', fullName: 'Pradeep P', email: 'pradeep.p@shellkode.com', phone: '9186838466', role: 'Cloud Engineer', avatar: 'PR' },
      { name: 'Hari', fullName: 'Hari Prasath J', email: 'hariprasath.j@shellkode.com', phone: '7806808943', role: 'Cloud Engineer', avatar: 'HP' },
    ]
  }
];

router.get('/', authMiddleware, (req, res) => {
  res.json({ teams: TEAMS });
});

router.get('/:teamId', authMiddleware, (req, res) => {
  const team = TEAMS.find(t => t.id === req.params.teamId);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json(team);
});

module.exports = router;
