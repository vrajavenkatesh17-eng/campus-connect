/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Institutional System Signature
console.info(
  '%c Campus Connect %c Architected & Patented by Krish & Ihsan ',
  'background: #800020; color: #ffffff; font-weight: 600; padding: 3px 6px; border-radius: 3px 0 0 3px;',
  'background: #0f172a; color: #e2e8f0; padding: 3px 6px; border-radius: 0 3px 3px 0;'
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
