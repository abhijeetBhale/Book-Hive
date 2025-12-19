import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import 'leaflet/dist/leaflet.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
)

// Register service worker and performance monitoring after app loads
if (import.meta.env.PROD) {
  // Dynamically import and register service worker
  import('./utils/serviceWorker.js').then(({ register, requestPersistentStorage }) => {
    register({
      onSuccess: () => {
        console.log('✅ App is ready for offline use');
      },
      onUpdate: () => {
        console.log('🔄 New app version available. Please refresh to update.');
      }
    });
    requestPersistentStorage();
  }).catch(error => {
    console.warn('Service worker not available:', error);
  });

  // Dynamically import performance monitoring
  import('./utils/performanceMonitor.js').then(({ default: performanceMonitor }) => {
    performanceMonitor.mark('app-loaded');
  }).catch(error => {
    console.warn('Performance monitoring not available:', error);
  });
}
