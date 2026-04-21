const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function diagnose() {
  console.log("--- FINAL Gemini Diagnostics ---");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const testModels = [
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.5-pro",
    "models/gemini-flash-latest",
    "models/gemini-1.5-flash"
  ];
  
  for (const modelName of testModels) {
    process.stdout.write(`Testing: ${modelName} ... `);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("hi");
      const response = await result.response;
      console.log(`✅ SUCCESS! (${response.text().substring(0, 10)})`);
      return;
    } catch (err) {
      console.log(`❌ FAILED (Status: ${err.status}, Msg: ${err.message})`);
    }
  }
}

diagnose().then(() => process.exit(0));
