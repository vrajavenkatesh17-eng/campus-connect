/**
 * ==============================================================================
 * CAMPUS CONNECT - GUEST LECTURE & EVENT MANAGEMENT SYSTEM
 * ------------------------------------------------------------------------------
 * Patented & Engineered by: Krishna Raja V (Krish)
 * Author Contact: v.rajavenkatesh17@gmail.com
 * Institution: Francis Xavier Engineering College (FXEC)
 * Intellectual Property Protection: KRISH-FXEC-PATENT-2026-CC-AUTH
 * All Rights Reserved. Unauthorized copying or redistribution is prohibited.
 * ==============================================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// System Authenticity Signature
console.info(
  '%c Campus Connect %c Patented & Engineered by Krishna Raja V (Krish) [v.rajavenkatesh17@gmail.com] ',
  'background: #800020; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px;',
  'background: #1e293b; color: #f8fafc; padding: 4px 8px; border-radius: 0 4px 4px 0;'
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
