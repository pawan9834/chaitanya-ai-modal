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
    console.log('Firebase Admin: Attempting Base64 Init...');
    // Remove any whitespace picked up during copy-pasting
    const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.replace(/\s/g, '');
    let jsonString = Buffer.from(base64, 'base64').toString('utf-8');
    
    // CRITICAL: Handle literal newlines that might be inside the decoded string
    // which cause JSON.parse to throw "Bad control character"
    const sanitizedJson = jsonString.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    
    const serviceAccount = JSON.parse(sanitizedJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin: SUCCESS (Base64)');
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
