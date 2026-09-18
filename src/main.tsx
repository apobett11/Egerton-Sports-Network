import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initOfflineSyncListener } from './lib/offlineQueue'
import { migrateStorageKeys } from './lib/storageMigration'

// Run storage key migration prior to application initialization
migrateStorageKeys();

// Initialize network recovery offline queue auto-sync listener
initOfflineSyncListener();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

