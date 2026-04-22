const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

/**
 * THE ATOMIC KEY FORMATTER
 * This function takes ANY string and turns it into a valid PEM private key.
 * It strips all whitespace, newlines, and corruption, then rebuilds it perfectly.
 */
function formatPrivateKey(pk) {
  if (!pk) return null;
  
  // 1. Strip headers/footers and ALL non-base64 characters
  let cleanData = pk
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[^A-Za-z0-9+/=]/g, ''); // Keep ONLY valid Base64 characters
    
  // 2. Reconstruct with standard PEM headers and 64-char line breaks
  let formatted = "-----BEGIN PRIVATE KEY-----\n";
  for (let i = 0; i < cleanData.length; i += 64) {
    formatted += cleanData.substring(i, i + 64) + "\n";
  }
  formatted += "-----END PRIVATE KEY-----\n";
  
  return formatted;
}

try {
  let credentials = null;

  // PRIORITY 1: Fragmented Vars (Most stable for Render)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('Firebase Admin: Using Fragmented Env Vars');
    credentials = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
  } 
  // PRIORITY 2: Local JSON File
  else if (fs.existsSync(serviceAccountPath)) {
    console.log('Firebase Admin: Using JSON File');
    credentials = require(path.resolve(serviceAccountPath));
  }
  // PRIORITY 3: Base64 JSON
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log('Firebase Admin: Using Base64 String');
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.replace(/\s/g, '');
    const jsonString = Buffer.from(base64, 'base64').toString('utf-8');
    credentials = JSON.parse(jsonString.replace(/\r?\n|\r/g, "\\n"));
  }

  if (credentials) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });
    console.log('Firebase Admin: INITIALIZED SUCCESSFULLY');
  } else {
    console.warn('Firebase Admin: WARNING - No credentials found. DB will fail.');
  }
} catch (err) {
  console.error('Firebase Admin: BOOT ERROR:', err.message);
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

module.exports = { admin, db, auth };
