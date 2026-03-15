# ShellKode MSP Operations Portal

A full-stack enterprise-grade Managed Service Provider portal for managing AWS cloud clients at scale.

---

## 🏗️ Architecture

```
shellkode-msp/
├── frontend/          # React 18 + Recharts (Port 3000)
│   └── src/
│       ├── pages/           # LoginPage, MSPDashboard, TeamPage, ClientsPage, ClientDetailPage
│       ├── components/
│       │   ├── layout/      # AppLayout (sidebar + topbar)
│       │   └── clients/     # SecurityPanel, CostPanel, InventoryPanel, OptimizerPanel,
│       │                    # PatchingPanel, SSLPanel, FreshdeskPanel, MonthlyReportPanel,
│       │                    # CredentialsModal
│       ├── context/         # AuthContext
│       └── utils/           # api.js, exportUtils.js
│
└── backend/           # Node.js + Express (Port 5000)
    └── src/
        ├── routes/    # auth, clients, aws, freshdesk, reports, team
        ├── models/    # User, Client, AuditReport (MongoDB)
        └── middleware/# auth (JWT)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Git

### 2. Clone & Install

```bash
git clone <your-repo>
cd shellkode-msp

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shellkode_msp
JWT_SECRET=your_super_secret_key_here_min_32_chars

# Google OAuth (for production SSO)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# FreshDesk Integration
FRESHDESK_DOMAIN=shellkode.freshdesk.com
FRESHDESK_API_KEY=your_freshdesk_api_key

ALLOWED_EMAIL_DOMAIN=shellkode.com
FRONTEND_URL=http://localhost:3000
```

### 4. Start Development

```bash
# From root — starts both frontend (3000) and backend (5000)
npm run dev
```

Or separately:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

### 5. Login

Open `http://localhost:3000`

Use any team member email from quick-access buttons, or type:
- `raghul.sasikumar@shellkode.com`
- `santhosh.b@shellkode.com`

> **Note:** Only `@shellkode.com` emails are allowed. The domain validation happens on both frontend and backend.

---

## 🔐 Google OAuth Setup (Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID (Web Application)
3. Add authorized redirect URIs:
   - `http://localhost:3000` (dev)
   - `https://yourdomain.com` (prod)
4. Copy Client ID → `GOOGLE_CLIENT_ID` in backend `.env`
5. In `frontend/src/pages/LoginPage.jsx`, replace the Google button with:

```jsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// Wrap your app in LoginPage.jsx:
<GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
  <GoogleLogin
    onSuccess={async (credentialResponse) => {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/msp');
    }}
    onError={() => setError('Google login failed')}
    theme="filled_black"
    shape="rectangular"
    text="signin_with"
  />
</GoogleOAuthProvider>
```

---

## ☁️ AWS Integration

### IAM User Setup (Per Client)

Create a read-only IAM user with these managed policies:
```
ReadOnlyAccess                    (AWS Managed — grants read access to all services)
```

Or use this minimal custom policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "s3:List*", "s3:Get*",
        "iam:List*", "iam:Get*",
        "rds:Describe*",
        "cloudtrail:Describe*", "cloudtrail:Get*",
        "cloudwatch:Get*", "cloudwatch:List*", "cloudwatch:Describe*",
        "lambda:List*", "lambda:Get*",
        "ce:Get*", "ce:List*", "ce:Describe*",
        "compute-optimizer:Get*", "compute-optimizer:Describe*",
        "securityhub:Get*", "securityhub:List*", "securityhub:Describe*",
        "config:Get*", "config:List*", "config:Describe*",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

### Enabling Real AWS API Calls

Replace mock data in `backend/src/routes/aws.js` with real SDK calls.

**Example — Real EC2 Inventory:**
```javascript
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

const getEC2Instances = async (credentials, region) => {
  const client = new EC2Client({ ...credentials, region });
  const response = await client.send(new DescribeInstancesCommand({}));
  return response.Reservations.flatMap(r => r.Instances).map(i => ({
    id: i.InstanceId,
    name: i.Tags?.find(t => t.Key === 'Name')?.Value || 'Unnamed',
    type: i.InstanceType,
    state: i.State.Name,
    region,
    az: i.Placement.AvailabilityZone,
    privateIp: i.PrivateIpAddress,
    launchTime: i.LaunchTime?.toISOString().split('T')[0]
  }));
};
```

**Example — Real Cost Explorer:**
```javascript
const { CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer');

const getCostData = async (credentials) => {
  const client = new CostExplorerClient({ ...credentials, region: 'us-east-1' }); // CE is global
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const response = await client.send(new GetCostAndUsageCommand({
    TimePeriod: { Start: start, End: end },
    Granularity: 'MONTHLY',
    Metrics: ['UnblendedCost'],
    GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
  }));
  return response.ResultsByTime;
};
```

---

## 🎫 FreshDesk Integration

1. Get your API key from FreshDesk Admin → Profile → API Key
2. Set in `.env`:
   ```env
   FRESHDESK_DOMAIN=shellkode.freshdesk.com
   FRESHDESK_API_KEY=your_key_here
   ```
3. The `/api/freshdesk/tickets/live` endpoint will use the real API
4. Currently falls back to mock data if credentials aren't set

---

## 📊 Features

| Feature | Status | Export Formats |
|---------|--------|----------------|
| 🛡️ Security Audit | ✅ Mock → AWS Security Hub | HTML, CSV |
| 💰 Cost Optimization | ✅ Mock → Cost Explorer | HTML, CSV |
| 📦 Inventory | ✅ Mock → EC2/RDS/S3/Lambda | CSV |
| ⚡ Compute Optimizer | ✅ Mock → AWS Optimizer | HTML |
| 🔧 EC2 Patching (Pre/Post) | ✅ Mock → SSM Patch Manager | HTML |
| 🔒 SSL & Domain Monitor | ✅ Mock → SSL Checker | CSV |
| 🎫 FreshDesk Tickets | ✅ Mock → FreshDesk API | — |
| 📄 Monthly Reports | ✅ Auto-Generated | HTML |

---

## 🗃️ Database

MongoDB collections:
- `users` — Team members (auto-created on first login)
- `clients` — 12 Cronos clients (auto-seeded on first run)
- `auditreports` — Stored audit/scan results

---

## 🌐 Deployment

### Docker (Recommended)

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/src ./src
EXPOSE 5000
CMD ["node", "src/index.js"]
```

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/shellkode_msp
JWT_SECRET=<generate with: openssl rand -hex 64>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
FRESHDESK_DOMAIN=shellkode.freshdesk.com
FRESHDESK_API_KEY=<from FreshDesk admin>
FRONTEND_URL=https://msp.shellkode.com
```

### Build Frontend

```bash
cd frontend
npm run build
# Serve build/ folder with nginx or Express static
```

---

## 👥 Team Cronos

| Name | Email | Phone |
|------|-------|-------|
| Subhasubalakshmi S | subhasubalakshmi.s@shellkode.com | 9043173878 |
| Raghul Sasikumar | raghul.sasikumar@shellkode.com | 7904350313 |
| Santhosh B | santhosh.b@shellkode.com | 8526407704 |
| Bhavesh K | bhavesh.k@shellkode.com | 8890569447 |
| Surya Krishna | surya.krishna@shellkode.com | 7013195007 |
| Gokul A | gokul.a@shellkode.com | 8838390568 |
| Arunachalam G | arunachalam.g@shellkode.com | 6381220655 |
| Hemanath U | hemanath.u@shellkode.com | 7448787737 |
| Lavanya K | lavanya.k@shellkode.com | 9344933152 |
| Pradeep P | pradeep.p@shellkode.com | 9186838466 |
| Hari Prasath J | hariprasath.j@shellkode.com | 7806808943 |

---

## 🔒 Security

- JWT tokens expire after 7 days
- Domain whitelist enforced on both frontend + backend
- AWS credentials stored encrypted (use AWS Secrets Manager in production)
- All routes protected by auth middleware
- Never commit `.env` file

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Recharts |
| Backend | Node.js, Express 4 |
| Database | MongoDB + Mongoose |
| Auth | Google OAuth 2.0 + JWT |
| AWS SDK | AWS SDK v3 (modular) |
| Exports | HTML generation, CSV/Excel |
| Styling | Pure CSS (no UI library) |

---

*Built for ShellKode Technologies · Team Cronos · MSP Operations Portal*
