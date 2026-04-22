const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

/**
 * THE ATOMIC KEY FORMATTER
 * This function takes ANY string and turns it into a valid PEM private key.
 */
function formatPrivateKey(pk) {
  if (!pk) return null;
  // 1. Convert literal "\n" text to actual newlines
  let cleaned = pk.replace(/\\n/g, '\n');
  // 2. Remove accidental surrounding quotes
  cleaned = cleaned.replace(/^['"]|['"]$/g, '');
  // 3. Ensure it has headers/footers
  if (!cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
    cleaned = `-----BEGIN PRIVATE KEY-----\n${cleaned}\n-----END PRIVATE KEY-----\n`;
  }
  return cleaned;
}

try {
  let credentials = null;

  // PRIORITY: Separate Env Vars (Most stable)
  // We check for PROJECT_ID and PRIVATE_KEY at minimum
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('Firebase Admin: Configured via separate ENV variables');
    credentials = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
  } 
  // FALLBACK 1: Local JSON
  else if (fs.existsSync(serviceAccountPath)) {
    console.log('Firebase Admin: Configured via JSON file');
    credentials = require(path.resolve(serviceAccountPath));
  }
  // FALLBACK 2: Base64 (Only if the others are missing)
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
