// Simple test script to validate ChatBot knowledge base integration
import ChatbotService from '../services/ChatbotService.js';

console.log('🧪 Testing Trash2Cash ChatBot Knowledge Base...');

// Test 1: Check knowledge base initialization
console.log('\n📚 Test 1: Knowledge Base Status');
const kbInfo = ChatbotService.getKnowledgeBaseInfo();
console.log('Knowledge Base Info:', kbInfo);

// Test 2: Check API status
console.log('\n🔧 Test 2: API Status');
const apiStatus = ChatbotService.getAPIStatus();
console.log('API Status:', apiStatus);

// Test 3: Test key responses
console.log('\n💬 Test 3: Testing Key Responses');

const testQueries = [
    'What is Trash2Cash?',
    'Tell me about smart bins',
    'What are the user roles?',
    'How does payment work?',
    'What technologies do you use?'
];

const testResponses = async () => {
    for (const query of testQueries) {
        console.log(`\n🔍 Query: "${query}"`);
        try {
            const response = await ChatbotService.generateResponse(query);
            console.log(`✅ Response: ${response.substring(0, 200)}...`);
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
        }
    }
};

// Test 4: Suggested questions
console.log('\n💡 Test 4: Suggested Questions');
const suggestions = ChatbotService.getSuggestedQuestions();
console.log('Available suggestions:', suggestions);

console.log('\n🎉 Knowledge Base Tests Completed!');

// Export for browser console testing
window.testChatBot = {
    testResponses,
    getKnowledgeBase: () => ChatbotService.getKnowledgeBaseInfo(),
    getAPIStatus: () => ChatbotService.getAPIStatus(),
    getSuggestions: () => ChatbotService.getSuggestedQuestions(),
    testQuery: (query) => ChatbotService.generateResponse(query)
};