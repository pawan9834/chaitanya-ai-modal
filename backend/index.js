const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();
const { admin, db, auth } = require('./firebaseAdmin');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const systemInstruction = "You are AstraVex, a premium AI assistant.";


// Transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow any origin for development/mobile testing
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// --- Authentication Middleware ---
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = req.cookies.token;

  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      token = match[1];
    }
  }
  
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('[AUTH_TOKEN_ERROR]', err.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// --- Routes ---

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Welcome to AstraVex - System Online!' });
});

app.get('/api/version', (req, res) => {
  res.json({ version: '1.0.5', timestamp: '2026-04-23T16:07' });
});

// Diagnostic endpoint to check Firebase status
app.get('/api/debug/firebase', async (req, res) => {
  const hasB64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const hasLegacyB64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const hasEnvVars = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY);
  const isInitialized = (admin.apps.length > 0);

  let dbTest = "Not Attempted";
  let dbError = null;
  let b64ParseError = null;

  if (hasB64) {
    try {
      JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8'));
    } catch (e) {
      b64ParseError = e.message;
    }
  }

  // Masking helpers
  const mask = (str) => {
    if (!str || str.length < 10) return "****";
    return `${str.substring(0, 5)}...${str.substring(str.length - 5)}`;
  };

  const keyStatus = process.env.FIREBASE_PRIVATE_KEY 
    ? (process.env.FIREBASE_PRIVATE_KEY.includes("BEGIN PRIVATE KEY") ? "Header Found ✅" : "Header Missing ❌ (Formatted later)")
    : "Key Missing ❌";

  if (isInitialized && db) {
    try {
      await db.collection('_debug_').doc('test').set({
        timestamp: new Date().toISOString(),
        message: "Connectivity Test"
      });
      const doc = await db.collection('_debug_').doc('test').get();
      dbTest = doc.exists ? "Write/Read Successful ✅" : "Write worked but document disappeared? ❓";
    } catch (e) {
      dbTest = "Failed ❌";
      dbError = e.message;
    }
  }

  res.json({
    status: isInitialized ? "Initialized" : "NOT Initialized",
    diagnostics: {
      hasB64,
      hasLegacyB64,
      hasEnvVars,
      b64Valid: hasB64 && !b64ParseError,
      b64Error: b64ParseError
    },
    credentialsPreview: {
      projectId: mask(process.env.FIREBASE_PROJECT_ID),
      clientEmail: mask(process.env.FIREBASE_CLIENT_EMAIL),
      privateKeyHeader: keyStatus,
      b64Preview: mask(process.env.FIREBASE_SERVICE_ACCOUNT_B64)
    },
    dbConnected: !!db,
    databaseTest: dbTest,
    databaseError: dbError,
    availableEnvKeys: Object.keys(process.env).filter(k => k.startsWith('FIREBASE_'))
  });
});

// Step 1: Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    if (db) {
      await db.collection('otps').doc(email).set({
        otp,
        expiresAt
      });
    }

    // 2. Send OTP via Email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your AstraVex OTP',
      text: `Your OTP for AstraVex is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ea580c; text-align: center;">AstraVex</h2>
          <p>Hello,</p>
          <p>Your one-time password (OTP) for logging into AstraVex is:</p>
          <div style="background: #fdf2f8; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ea580c;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP will expire in 5 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">© 2026 AstraVex. All rights reserved.</p>
        </div>
      `,
    };

    // Try sending real email, but fallback to console if SMTP is not configured
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[AUTH] Email sent successfully to ${email}`);
      res.json({ message: 'OTP sent to your email successfully' });
    } catch (mailError) {
      console.error('[AUTH] Email delivery failed:', mailError);
      console.log(`[AUTH] FALLBACK: OTP for ${email}: ${otp}`);
      res.json({
        message: 'OTP generated (Email delivery failed). Check server console for demo purposes.',
        fallback: true
      });
    }
  } catch (error) {
    console.error('[AUTH_ERROR]', error);
    res.status(500).json({
      message: 'Failed to send OTP',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// --- NEW: Generate Unique Guest Session ---
app.post('/api/auth/guest-session', async (req, res) => {
  try {
    const crypto = require('crypto');
    const guestId = `guest_${crypto.randomUUID().substring(0, 8)}`;
    const userData = {
      email: guestId,
      name: 'Guest User',
      profession: 'Visitor',
      createdAt: new Date().toISOString()
    };

    const token = jwt.sign({ email: userData.email, id: userData.email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Guest session created', user: userData, token });
  } catch (error) {
    console.error('[GUEST_AUTH] Error:', error);
    res.status(500).json({ message: 'Failed to create guest session' });
  }
});

// Step 2: Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    // Hardcoded bypass for Easy Login (test@example.com / 123456)
    const isTestAccount = email === 'test@example.com' && otp === '123456';

    if (!isTestAccount) {
      const otpDoc = await db.collection('otps').doc(email).get();
      if (!otpDoc.exists) return res.status(400).json({ message: 'OTP not found' });

      const data = otpDoc.data();
      if (data.otp !== otp || Date.now() > data.expiresAt) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(email).get();
    const exists = userDoc.exists;

    // Delete OTP after verification (if not test account)
    if (!isTestAccount) {
      await db.collection('otps').doc(email).delete();
    }

    if (exists || isTestAccount) {
      const userData = userDoc.exists ? userDoc.data() : {
        email: 'test@example.com',
        name: 'Guest User',
        profession: 'Tester',
        createdAt: new Date().toISOString()
      };
      const token = jwt.sign({ email: userData.email, id: userData.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: false, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ registered: true, user: userData, token });
    } else {
      return res.json({ registered: false, message: 'Please complete your profile' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Step 3: Register / Complete Profile
app.post('/api/auth/register', async (req, res) => {
  const { email, name, profession, dob } = req.body;
  if (!email || !name || !profession) return res.status(400).json({ message: 'All fields are required' });

  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const userData = { email, name, profession, dob: dob || null, createdAt: new Date().toISOString() };
    await db.collection('users').doc(email).set(userData);

    const token = jwt.sign({ email, id: email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: false, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ message: 'User registered successfully', user: userData, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Google Sign-In
app.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'Token is required' });

  try {
    if (!auth || !db) return res.status(500).json({ message: 'Firebase not initialized' });

    const decodedToken = await auth.verifyIdToken(idToken);
    const { email, name, picture } = decodedToken;

    // Check if user exists in Firestore
    let userDoc = await db.collection('users').doc(email).get();
    let userData;

    if (!userDoc.exists) {
      userData = { email, name, profession: 'Other', picture, createdAt: new Date().toISOString() };
      await db.collection('users').doc(email).set(userData);
    } else {
      userData = { ...userDoc.data(), picture }; // Always update picture to keep it fresh
      await db.collection('users').doc(email).update({ picture });
    }

    const token = jwt.sign({ email, id: email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: false, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ message: 'Success', user: userData, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// --- AI Chat Endpoint ---
app.post('/api/chat', authenticateToken, async (req, res) => {
  let { message: incomingMessage, history, image, conversationId, modelId } = req.body;

  if (!incomingMessage && !image) {
    return res.status(400).json({ message: 'Message or file is required' });
  }

  // --- Document Parsing ---
  let docText = '';
  if (image && !image.startsWith('data:image')) {
     try {
       const [header, base64Data] = image.split(',');
       const buffer = Buffer.from(base64Data, 'base64');
       
       if (header.includes('pdf')) {
         const data = await pdf(buffer);
         docText = data.text;
       } else if (header.includes('word') || header.includes('officedocument')) {
         const result = await mammoth.extractRawText({ buffer });
         docText = result.value;
       } else if (header.includes('text/plain')) {
         docText = buffer.toString('utf8');
       }

       if (docText) {
         incomingMessage = `[PROCESSED DOCUMENT CONTENT]\n${docText}\n\n---\nUser Query: ${incomingMessage || "Please analyze this document."}`;
         image = null; // Clear image so it doesn't try to send doc as image to Gemini
       }
     } catch (err) {
      console.error('[DOC_PARSE_ERROR]', err);
     }
  }

  // Dynamic Model Selection
    // Map branded names to technical IDs
    let geminiModelId = 'gemini-1.5-flash-latest';
    switch (modelId) {
      case 'AstraVex - Pro':
        geminiModelId = 'gemini-1.5-pro';
        break;
      case 'AstraVex - Ultra':
        geminiModelId = 'gemini-2.0-flash-exp';
        break;
      case 'AstraVex - Flash':
      default:
        geminiModelId = 'gemini-1.5-flash-latest';
    }
  const currentModel = genAI.getGenerativeModel({ model: geminiModelId });

  const userTimestamp = new Date().toISOString();
  const userMsgId = Date.now().toString() + '_u';

  try {
    // 1. Prepare and Clean Chat History for Gemini format
    let chatHistory = (history || [])
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content || "" }],
      }))
      .filter(msg => msg.parts[0].text.trim() !== "");

    // Gemini requires:
    // - First message must be 'user'
    // - Roles must strictly alternate (user, model, user, model...)

    // Remove leading model messages
    while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
      chatHistory.shift();
    }

    // Ensure alternating roles
    const cleanedHistory = [];
    let lastRole = null;
    for (const msg of chatHistory) {
      if (msg.role !== lastRole) {
        cleanedHistory.push(msg);
        lastRole = msg.role;
      }
    }

    // Ensure it doesn't end with a model message (optional but safer)
    // Actually Gemini allows it but it's better to end with model so the next is user
    // However, if we end with user, startChat works fine as well.

    chatHistory = cleanedHistory;

    const chat = currentModel.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    // Manually prepend system instruction as a user message if it's the first message
    let finalMessage = incomingMessage;
    if (chatHistory.length === 0) {
      finalMessage = `${systemInstruction}\n\nUser: ${incomingMessage || "Hello"}`;
    }

    let result;
    if (image) {
      // Handle Multi-modal (Text + Image)
      const imageData = {
        inlineData: {
          data: image.includes('base64,') ? image.split(',')[1] : image,
          mimeType: image.includes('image/') ? image.split(';')[0].split(':')[1] : 'image/png'
        }
      };
      result = await currentModel.generateContent([finalMessage || "What is in this image?", imageData]);
    } else {
      // Standard Text Chat
      result = await chat.sendMessage(finalMessage || "Hello");
    }

    const response = await result.response;
    const text = response.text();

    const aiResponse = {
      id: Date.now().toString(),
      role: 'assistant',
      content: text,
      timestamp: new Date().toISOString()
    };

    // --- NEW: Save to Firestore ---
    let actualConversationId = conversationId;
    if (db) {
      const userEmail = req.user.id;
      const conversationsRef = db.collection('users').doc(userEmail).collection('conversations');

      // 1. Determine or Create Conversation
      if (!actualConversationId) {
        actualConversationId = Date.now().toString();
        // Create conversation doc with metadata
        await conversationsRef.doc(actualConversationId).set({
          id: actualConversationId,
          title: incomingMessage ? (incomingMessage.substring(0, 30) + (incomingMessage.length > 30 ? '...' : '')) : "Image Chat",
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      } else {
        // Update existing conversation timestamp
        await conversationsRef.doc(actualConversationId).update({
          updatedAt: new Date().toISOString()
        });
      }

      const messagesRef = conversationsRef.doc(actualConversationId).collection('messages');

      // Save User Message
      const userMsgToSave = {
        id: userMsgId,
        role: 'user',
        content: incomingMessage || "",
        image: image || null,
        timestamp: userTimestamp
      };
      await messagesRef.doc(userMsgToSave.id).set(userMsgToSave);

      // Save AI Message
      await messagesRef.doc(aiResponse.id).set(aiResponse);
    }

    res.json({ ...aiResponse, conversationId: actualConversationId });
  } catch (error) {
    console.error('[AI] Gemini Error:', error);
    const status = error.status || 500;
    const errorMsg = error.status === 429
      ? 'AI Quota exceeded. Please wait a few seconds and try again.'
      : (error.message || 'AI failed to respond. Please check your API key.');

    res.status(status).json({ message: errorMsg });
  }
});

// --- Image Generation Endpoint ---
app.post('/api/generate-image', authenticateToken, async (req, res) => {
  const { prompt, conversationId } = req.body;
  if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

  const userTimestamp = new Date().toISOString();
  const userMsgId = Date.now().toString() + '_u';
  const aiMsgId = Date.now().toString() + '_ai';

  try {
    // Generate URL (Pollinations AI)
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;

    const aiResponse = {
      id: aiMsgId,
      role: 'assistant',
      content: `Here is your creation:`,
      generatedImage: imageUrl,
      timestamp: new Date().toISOString()
    };

    let actualConversationId = conversationId;
    if (db) {
      const userEmail = req.user.id;
      const conversationsRef = db.collection('users').doc(userEmail).collection('conversations');

      if (!actualConversationId) {
        actualConversationId = Date.now().toString();
        await conversationsRef.doc(actualConversationId).set({
          id: actualConversationId,
          title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      } else {
        await conversationsRef.doc(actualConversationId).update({ updatedAt: new Date().toISOString() });
      }

      const messagesRef = conversationsRef.doc(actualConversationId).collection('messages');
      
      // Save User Message
      await messagesRef.doc(userMsgId).set({
        id: userMsgId,
        role: 'user',
        content: prompt,
        timestamp: userTimestamp
      });

      // Save AI Message with Image
      await messagesRef.doc(aiMsgId).set(aiResponse);
    }

    res.json({ ...aiResponse, conversationId: actualConversationId });
  } catch (error) {
    console.error('[IMAGE] Error:', error);
    res.status(500).json({ message: 'Image generation failed.' });
  }
});

// --- Video Generation Endpoint (Premium Feature) ---
app.post('/api/generate-video', authenticateToken, async (req, res) => {
  const { prompt, conversationId } = req.body;
  if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

  const aiMsgId = Date.now().toString() + '_ai';

  try {
    // Standardizing on a high-end simulation for the beta
    const aiResponse = {
      id: aiMsgId,
      role: 'assistant',
      content: `I've started rendering your cinematic video based on: "${prompt}". \n\n(Note: Video rendering is in high-demand and may take 30-60 seconds to appear in your gallery.)`,
      timestamp: new Date().toISOString()
    };

    res.json({ ...aiResponse, conversationId });
  } catch (error) {
    res.status(500).json({ message: 'Video generation failed.' });
  }
});

// --- NEW: Get Chat History for a Specific Conversation ---
app.get('/api/chat/history', authenticateToken, async (req, res) => {
  const { conversationId } = req.query;

  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    if (!conversationId) return res.json([]); // Return empty if no conversation selected

    const userEmail = req.user.id;
    const messagesSnapshot = await db.collection('users')
      .doc(userEmail)
      .collection('conversations')
      .doc(conversationId.toString())
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();

    const history = [];
    messagesSnapshot.forEach(doc => history.push(doc.data()));

    res.json(history);
  } catch (error) {
    console.error('[HISTORY] Error:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// --- NEW: Get List of All Conversations ---
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const userEmail = req.user.id;
    const convsSnapshot = await db.collection('users')
      .doc(userEmail)
      .collection('conversations')
      .orderBy('updatedAt', 'desc')
      .get();

    const conversations = [];
    convsSnapshot.forEach(doc => conversations.push(doc.data()));

    res.json(conversations);
  } catch (error) {
    console.error('[CONV_LIST] Error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// --- Data Control Endpoints ---

// 1. Delete all conversations
app.post('/api/user/delete-conversations', authenticateToken, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    const userEmail = req.user.id;
    const conversationsRef = db.collection('users').doc(userEmail).collection('conversations');
    
    // Recursive delete is supported by Admin SDK
    await db.recursiveDelete(conversationsRef);
    
    res.json({ message: 'All conversations and history deleted' });
  } catch (error) {
    console.error('[DELETE_CONVS] Error:', error);
    res.status(500).json({ message: 'Failed to delete conversations' });
  }
});

// 2. Delete all images (Wipe image fields in all messages)
app.post('/api/user/delete-media', authenticateToken, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    const userEmail = req.user.id;
    const conversationsSnapshot = await db.collection('users').doc(userEmail).collection('conversations').get();

    const batch = db.batch();
    for (const convDoc of conversationsSnapshot.docs) {
      const messagesSnapshot = await convDoc.ref.collection('messages').get();
      messagesSnapshot.forEach(msgDoc => {
        if (msgDoc.data().image) {
          batch.update(msgDoc.ref, { image: admin.firestore.FieldValue.delete() });
        }
      });
    }
    
    await batch.commit();
    res.json({ message: 'All media and generated images deleted' });
  } catch (error) {
    console.error('[DELETE_MEDIA] Error:', error);
    res.status(500).json({ message: 'Failed to delete media' });
  }
});

// 3. Delete Account (Full Wipe)
app.post('/api/user/delete-account', authenticateToken, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });
    const userEmail = req.user.id;
    const userRef = db.collection('users').doc(userEmail);
    
    // Recursive delete the entire user document and all subcollections
    await db.recursiveDelete(userRef);
    
    // If they have a Firebase Auth account, we could also delete it here:
    // await admin.auth().deleteUser(userEmail).catch(() => {});

    res.clearCookie('token');
    res.json({ message: 'Account and all data permanently deleted' });
  } catch (error) {
    console.error('[DELETE_ACCOUNT] Error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// --- NEW: Update User Profile ---
app.post('/api/user/profile', authenticateToken, async (req, res) => {
  const { name, profession, dob } = req.body;
  const userEmail = req.user.id;

  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const updateData = {};
    if (name) updateData.name = name;
    if (profession) updateData.profession = profession;
    if (dob) updateData.dob = dob;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    await db.collection('users').doc(userEmail).update(updateData);
    
    // Fetch updated user
    const userDoc = await db.collection('users').doc(userEmail).get();
    res.json({ message: 'Profile updated successfully', user: userDoc.data() });
  } catch (error) {
    console.error('[PROFILE_UPDATE] Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// Trigger Rebuild
