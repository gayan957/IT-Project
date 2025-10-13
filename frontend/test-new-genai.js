import { GoogleGenAI } from "@google/genai";

// Test the new Google GenAI implementation
async function testNewAPI() {
  console.log('🧪 Testing new Google GenAI implementation...');
  
  const apiKey = import.meta.env.VITE_CHAT_MODEL_API;
  if (!apiKey) {
    console.error('❌ VITE_CHAT_MODEL_API not found!');
    return;
  }
  
  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  
  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });
    
    console.log('✅ GoogleGenAI instance created');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Explain how AI works in waste management in 2 sentences",
    });
    
    console.log('🤖 AI Response:', response.text);
    return response.text;
    
  } catch (error) {
    console.error('❌ API Test failed:', error);
    return null;
  }
}

// Make it available in browser console
window.testNewGoogleGenAI = testNewAPI;

export default testNewAPI;