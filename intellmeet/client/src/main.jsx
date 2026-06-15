import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import './index.css';
import App from './App.jsx';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {sentryDsn ? (
      <Sentry.ErrorBoundary fallback={({ error }) => (
        <div style={{ padding: '2rem', color: '#ef4444', backgroundColor: '#0b0f19', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '2.5rem', maxWidth: '480px', textAlign: 'center', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f87171', marginBottom: '1.5rem' }}>
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h2 style={{ color: '#f3f4f6', fontSize: '20px', fontWeight: '600', marginBottom: '0.75rem' }}>Application Encountered an Error</h2>
            <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              We apologize for the interruption. The system has automatically logged this incident, and our developers are working on a resolution.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ padding: '0.625rem 1.25rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500', fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              Reload Workspace
            </button>
          </div>
        </div>
      )}>
        <App />
      </Sentry.ErrorBoundary>
    ) : (
      <App />
    )}
  </StrictMode>,
);
