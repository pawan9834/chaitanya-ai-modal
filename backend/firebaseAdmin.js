const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

/**
 * THE ATOMIC KEY FORMATTER
 * This function takes ANY string and turns it into a valid PEM private key.
 */
const formatPrivateKey = (key) => {
  if (!key) return undefined;
  
  // 1. Remove potential leading/trailing double quotes if pasted in dashboard with them
  let formatted = key.trim();
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.substring(1, formatted.length - 1);
  }
  
  // 2. Replace literal "\\n" strings with actual newline characters
  // 3. Keep original newlines if they are already present
  let cleaned = formatted.replace(/\\n/g, '\n');

  // 4. Ensure it has headers/footers
  if (!cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
    cleaned = `-----BEGIN PRIVATE KEY-----\n${cleaned}\n-----END PRIVATE KEY-----\n`;
  }
  return cleaned;
}

try {
  let credentials = null;

  // PRIORITY 1: Base64 Service Account (Foolproof for Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8');
      credentials = JSON.parse(decoded);
      console.log('Firebase Admin: Initialized via Base64');
    } catch (e) {
      console.error('Firebase Admin: Failed to parse Base64 credentials', e.message);
    }
  }

  // PRIORITY 2: Fragmented Env Vars
  if (!credentials && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    credentials = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
    console.log('Firebase Admin: Initialized via Env Vars');
  }
  // FALLBACK 1: Local JSON
  else if (fs.existsSync(serviceAccountPath)) {
    console.log('Firebase Admin: Configured via JSON file');
    credentials = require(path.resolve(serviceAccountPath));
  }
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log('Firebase Admin: Configured via Base64');
    try {
      const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.replace(/\s/g, '');
      const jsonString = Buffer.from(base64, 'base64').toString('utf-8');
      credentials = JSON.parse(jsonString.replace(/\r?\n|\r/g, "\\n"));
    } catch (e) {
      console.error('Firebase Admin: Base64 Decryption Failed:', e.message);
    }
  }

  if (credentials) {
    // Only initialize if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(credentials)
      });
      console.log('Firebase Admin: INITIALIZED SUCCESSFULLY');
    }
  } else {
    console.warn('Firebase Admin: WARNING - No credentials found in environment.');
  }
} catch (err) {
  console.error('Firebase Admin: CRITICAL BOOT ERROR:', err.message);
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

module.exports = { admin, db, auth };
