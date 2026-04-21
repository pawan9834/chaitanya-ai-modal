const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const { db, auth } = require('./firebaseAdmin');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
});
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

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// --- Authentication Middleware ---
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// --- Routes ---

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Welcome to AstraVex - System Online!' });
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
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Step 2: Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const otpDoc = await db.collection('otps').doc(email).get();
    if (!otpDoc.exists) return res.status(400).json({ message: 'OTP not found' });

    const data = otpDoc.data();
    if (data.otp !== otp || Date.now() > data.expiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(email).get();
    const exists = userDoc.exists;

    // Delete OTP after verification
    await db.collection('otps').doc(email).delete();

    if (exists) {
      const userData = userDoc.data();
      const token = jwt.sign({ email: userData.email, id: email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.json({ registered: true, user: userData });
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
  const { email, name, profession } = req.body;
  if (!email || !name || !profession) return res.status(400).json({ message: 'All fields are required' });

  try {
    if (!db) return res.status(500).json({ message: 'Database not initialized' });

    const userData = { email, name, profession, createdAt: new Date().toISOString() };
    await db.collection('users').doc(email).set(userData);

    const token = jwt.sign({ email, id: email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ message: 'User registered successfully', user: userData });
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
      userData = userDoc.data();
    }

    const token = jwt.sign({ email, id: email }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ message: 'Success', user: userData });
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
  let { message: incomingMessage, history, image, conversationId } = req.body;
  
  if (!incomingMessage && !image) {
    return res.status(400).json({ message: 'Message or image is required' });
  }

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

    const chat = model.startChat({
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
      result = await model.generateContent([finalMessage || "What is in this image?", imageData]);
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
