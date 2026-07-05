import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';
import './index.css';

// Jika deploy frontend di Vercel + backend di Render,
// set env var VITE_API_BASE_URL ke URL backend Render-mu
// Contoh: https://donghuastream-api.onrender.com
const apiBase = import.meta.env.VITE_API_BASE_URL;
if (apiBase) {
  setBaseUrl(apiBase);
}

createRoot(document.getElementById('root')!).render(<App />);
