import axios from 'axios';

var BACKEND_URL = 'https://msp-project-production.up.railway.app';

var api = axios.create({
  baseURL: BACKEND_URL + '/api',
  timeout: 30000,
});

api.interceptors.request.use(function(config) {
  var token = localStorage.getItem('msp_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  function(r) { return r; },
  function(err) {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('msp_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
