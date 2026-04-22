const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

/**
 * Robustly formats a private key string for Firebase.
 * Handles escaped newlines, literal newlines, and missing headers.
 */
function formatPrivateKey(pk) {
  if (!pk) return null;
  // 1. Handle literal escaped newlines (e.g. from Render dashboard)
  let cleaned = pk.replace(/\\n/g, '\n');
  
  // 2. Remove any accidental surrounding quotes
  cleaned = cleaned.replace(/^['"]|['"]$/g, '');
  
  // 3. Ensure it looks like a proper PEM key
  if (!cleaned.includes('-----BEGIN PRIVATE KEY-----')) {
    cleaned = `-----BEGIN PRIVATE KEY-----\n${cleaned}\n-----END PRIVATE KEY-----\n`;
  }
  
  return cleaned;
}

try {
  // Option 1: Local JSON File
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(path.resolve(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin: SUCCESS (Init via JSON File)');
  } 
  // Option 2: Fragmented Environment Variables (Most stable for Cloud)
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('Firebase Admin: Attempting fragmented Env Var Init...');
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin: SUCCESS (Init via Fragmented Env Vars)');
  }
  // Option 3: Base64 Encoded JSON (Legacy/Fallback)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log('Firebase Admin: Attempting Base64 Init...');
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.replace(/\s/g, '');
    const jsonString = Buffer.from(base64, 'base64').toString('utf-8');
    
    // Minimal sanitation for JSON parse
    const sanitizedJson = jsonString.replace(/\n/g, '\\n').replace(/\r/g, '');
    const serviceAccount = JSON.parse(sanitizedJson);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin: SUCCESS (Init via Base64)');
  } 
  else {
    console.error('Firebase Admin: FAILED - No credentials found.');
    console.error('Check Render for FIREBASE_PROJECT_ID and FIREBASE_PRIVATE_KEY.');
  }
} catch (err) {
  console.error('Firebase Admin: CRITICAL ERROR during init:', err.message);
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

module.exports = { admin, db, auth };
