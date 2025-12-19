import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import 'leaflet/dist/leaflet.css'
import { register as registerSW, requestPersistentStorage } from './utils/serviceWorker.js'
import performanceMonitor from './utils/performanceMonitor.js'

// Register service worker for better performance and offline support
if (import.meta.env.PROD) {
  registerSW({
    onSuccess: () => {
      console.log('✅ App is ready for offline use');
      performanceMonitor.mark('sw-ready');
    },
    onUpdate: () => {
      console.log('🔄 New app version available. Please refresh to update.');
      // You could show a toast notification here
    }
  });
  
  // Request persistent storage for better caching
  requestPersistentStorage();
}

// Mark app initialization
performanceMonitor.mark('app-init-start');

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
)

// Mark app initialization complete
performanceMonitor.mark('app-init-complete');
performanceMonitor.measure('app-initialization', 'app-init-start', 'app-init-complete');
