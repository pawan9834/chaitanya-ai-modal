const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(path.resolve(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin: SUCCESS (JSON File)');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log('Firebase Admin: Attempting Base64 Init...');
    const rawB64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "";
    // Clean whitespace from the Base64 itself
    const base64 = rawB64.replace(/\s/g, '');
    let jsonString = Buffer.from(base64, 'base64').toString('utf-8');
    
    // THE INVINCIBLE SANITIZER:
    // 1. Remove all literal ASCII control characters (0-31) except for normal ones we handle
    // 2. We allow \n \r \t only if they are escaped sequences, but JSON.parse hates literal ones.
    const sanitizedJson = jsonString.replace(/[\x00-\x1F]/g, (match) => {
      if (match === '\n') return '\\n';
      if (match === '\r') return '';
      if (match === '\t') return ' ';
      return '';
    });
    
    try {
      const serviceAccount = JSON.parse(sanitizedJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin: SUCCESS (Base64)');
    } catch (parseErr) {
      console.error('Firebase Admin: JSON PARSE FAILED at position:', parseErr.message);
      // Log the context around the failure for the user to see
      const posMatch = parseErr.message.match(/position (\d+)/);
      if (posMatch) {
         const pos = parseInt(posMatch[1]);
         console.error('Error Context:', sanitizedJson.substring(Math.max(0, pos - 20), Math.min(sanitizedJson.length, pos + 20)));
      }
      throw parseErr;
    }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('Firebase Admin: Attempting Env Var Init...');
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/^['"]|['"]$/g, '');
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin: SUCCESS (Env Vars)');
  } else {
    console.error('Firebase Admin: FAILED - No credentials found in ENV or JSON.');
    console.error('Available keys:', Object.keys(process.env).filter(k => k.startsWith('FIREBASE')));
  }
} catch (err) {
  console.error('Firebase Admin: CRITICAL ERROR during init:', err.message);
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

module.exports = { admin, db, auth };
