import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SessionSecurity, EnvironmentSecurity } from './utils/securityUtils';
import App from './App.tsx';
import './index.css';

// Initialize security monitoring
SessionSecurity.initialize();

// Check environment security
const envCheck = EnvironmentSecurity.checkEnvironment();
if (!envCheck.isSecure) {
  console.warn('Security warnings:', envCheck.warnings);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
