import { useState } from 'react';
import ChatbotService from '../services/ChatbotService';

export default function TestChatbotKnowledge() {
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const testQueries = [
    "What is Trash2Cash?",
    "Tell me about smart bins",
    "What are the user roles?",
    "How does payment work?",
    "What problems do you solve?",
    "What technologies do you use?",
    "What are your environmental benefits?",
    "What waste types do you handle?",
    "Tell me about the technical specifications"
  ];

  const testKnowledgeBase = async () => {
    setIsLoading(true);
    setResponses([]);

    // Test knowledge base info
    const kbInfo = ChatbotService.getKnowledgeBaseInfo();
    console.log('📊 Knowledge Base Info:', kbInfo);

    const results = [];
    
    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`🔍 Testing query ${i + 1}: "${query}"`);
      
      try {
        const response = await ChatbotService.generateResponse(query);
        results.push({
          query,
          response,
          timestamp: new Date(),
          success: true
        });
        console.log(`✅ Response ${i + 1}:`, response.substring(0, 100) + '...');
      } catch (error) {
        console.error(`❌ Error with query ${i + 1}:`, error);
        results.push({
          query,
          response: `Error: ${error.message}`,
          timestamp: new Date(),
          success: false
        });
      }

      // Add slight delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setResponses(results);
    setIsLoading(false);
  };

  const testAPIStatus = () => {
    const status = ChatbotService.getAPIStatus();
    console.log('🔧 API Status:', status);
    
    const kbInfo = ChatbotService.getKnowledgeBaseInfo();
    console.log('📚 Knowledge Base Info:', kbInfo);
    
    alert(`API Status:
✅ Chat Key: ${status.hasChatKey ? 'Available' : 'Missing'}
✅ AI Initialized: ${status.aiInitialized ? 'Yes' : 'No'}
📊 Chat History: ${status.chatHistory} messages

Knowledge Base:
📝 Platform: ${kbInfo.platform}
🏗️ Modules: ${kbInfo.modules}
👥 User Roles: ${kbInfo.userRoles}
♻️ Waste Types: ${kbInfo.wasteTypes}
🌱 Environmental Benefits: ${kbInfo.environmentalBenefits}
⚠️ Problems Addressed: ${kbInfo.problems}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🤖 Trash2Cash ChatBot Knowledge Base Test
        </h1>
        <p className="text-gray-600">
          Testing the enhanced ChatBot with comprehensive Trash2Cash knowledge base
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={testKnowledgeBase}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-lg hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Testing Knowledge Base...</span>
            </div>
          ) : (
            "🧪 Test Knowledge Base Responses"
          )}
        </button>

        <button
          onClick={testAPIStatus}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          📊 Check API & KB Status
        </button>
      </div>

      {responses.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
            🧪 Test Results ({responses.length} queries tested)
          </h2>
          
          <div className="grid gap-6">
            {responses.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">
                    Query #{index + 1}: "{result.query}"
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {result.success ? '✅ Success' : '❌ Error'}
                  </span>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-700 whitespace-pre-line">
                    {result.response}
                  </p>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  Response at: {result.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">💡 Knowledge Base Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✅ Comprehensive Trash2Cash platform information</li>
          <li>✅ 5 detailed user roles and their functions</li>
          <li>✅ 5 core system modules with technical details</li>
          <li>✅ MERN stack technical specifications</li>
          <li>✅ IoT integration (ESP32, ultrasonic sensors)</li>
          <li>✅ API integrations (Stripe, Google Maps)</li>
          <li>✅ Environmental benefits and problem solutions</li>
          <li>✅ Supported waste types and processes</li>
          <li>✅ Dynamic response generation with context</li>
          <li>✅ Enhanced suggested questions</li>
        </ul>
      </div>
    </div>
  );
}