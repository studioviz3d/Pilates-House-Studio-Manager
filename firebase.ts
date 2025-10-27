
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { getFirestore, Timestamp } from "firebase/firestore";

// =================================================================    
// IMPORTANT: ACTION REQUIRED FOR LOCAL DEVELOPMENT
// =================================================================
// To run this app locally (not using `firebase serve`), you need to
// paste your Firebase project's configuration object here.
//
// 1. Go to your Firebase project console (for your DEV project).
// 2. In the left-hand menu, click the gear icon, then "Project settings".
// 3. In the "Your apps" card, select your Web app.
// 4. Under "Firebase SDK snippet", select "Config".
// 5. Copy the `firebaseConfig` object and paste it below, replacing the placeholders.
// =================================================================
const firebaseConfig = {
  apiKey: "AIzaSy_...REPLACE_WITH_YOUR_API_KEY",
  authDomain: "your-dev-project-id.firebaseapp.com",
  projectId: "your-dev-project-id",
  storageBucket: "your-dev-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};


// This logic ensures that we use the auto-injected config from Firebase Hosting
// when deployed, but fall back to our local config for development.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);


// Initialize Firebase services
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence
});
export const db = getFirestore(app);

// Export Timestamp for use in data hooks
export { Timestamp };