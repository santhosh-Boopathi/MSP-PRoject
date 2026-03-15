import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('msp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('msp_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

## Then in Railway — Add this variable to the FRONTEND service

Once your backend is deployed and you have its URL (like `https://shellkode-backend.up.railway.app`), go to frontend service → **Variables** → add:
```
REACT_APP_API_URL=https://your-backend-url.up.railway.app
