const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function diagnose() {
  console.log("--- Gemini Diagnostics ---");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const testModels = [
    "gemini-1.5-flash", 
    "gemini-1.5-flash-latest", 
    "gemini-1.5-pro", 
    "gemini-pro", 
    "models/gemini-1.5-flash",
    "models/gemini-pro"
  ];
  
  for (const modelName of testModels) {
    process.stdout.write(`Testing model: ${modelName} ... `);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("hi");
      const response = await result.response;
      console.log(`✅ SUCCESS: ${response.text().substring(0, 15)}...`);
      return modelName; // Found it!
    } catch (err) {
      console.log(`❌ FAILED (Status: ${err.status})`);
    }
  }
  return null;
}

diagnose().then(name => {
  if (name) console.log(`\nRECOMMENDED MODEL: ${name}`);
  else console.log("\n❌ NO WORKING MODEL FOUND. Please check your API key in .env");
  process.exit(0);
});
