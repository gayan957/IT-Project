import ChatbotService from './src/services/ChatbotService.js';

console.log('🤖 Testing ChatBot AI Dynamic Responses...');

// Test questions to verify dynamic AI responses
const testQuestions = [
  "What is Trash2Cash and how does it work?",
  "Tell me about smart bins and IoT technology",
  "How can I reduce waste in my home?",
  "What are the environmental benefits of recycling?",
  "How does pickup scheduling work in your system?"
];

async function testAI() {
  console.log('🔍 Testing API Key Configuration...');
  
  // Check API keys
  const geminiKey = import.meta.env?.VITE_GEMINI_API_KEY;
  const chatKey = import.meta.env?.VITE_CHAT_MODEL_API;
  
  console.log('VITE_GEMINI_API_KEY:', geminiKey ? '✅ Found' : '❌ Missing');
  console.log('VITE_CHAT_MODEL_API:', chatKey ? '✅ Found' : '❌ Missing');
  
  if (!geminiKey && !chatKey) {
    console.error('❌ No API keys found! ChatBot will use local responses only.');
    return;
  }
  
  console.log('\n🚀 Testing Dynamic AI Responses...\n');
  
  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`📝 Question ${i + 1}: ${question}`);
    
    try {
      const response = await ChatbotService.generateResponse(question);
      
      // Analyze response characteristics
      const isLikelyAI = response.length > 80 && 
                        !response.includes('🗑️') && 
                        !response.includes('Here\'s how it works:');
      
      console.log(`🤖 Response: ${response}`);
      console.log(`📊 Analysis: ${isLikelyAI ? '✅ Likely AI' : '⚠️ Likely Local'} (${response.length} chars)`);
      console.log('─'.repeat(80));
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error for question ${i + 1}:`, error);
    }
  }
  
  console.log('\n✅ AI Testing Complete!');
}

// Export for use in browser console
window.testChatBotAI = testAI;

console.log('💡 Run window.testChatBotAI() in browser console to test AI responses');

export default testAI;