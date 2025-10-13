import ChatbotService from '../services/ChatbotService';
import { useState } from 'react';

export default function ChatBotAITest() {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const testQuestions = [
    "What is Trash2Cash?",
    "How does the IoT bin system work?",
    "What are the benefits of using smart waste management?",
    "Tell me about recycling in Colombo",
    "How can I reduce my carbon footprint with waste management?",
    "What types of waste do you handle?",
    "How does the pickup scheduling work?"
  ];

  const runAITest = async () => {
    setIsLoading(true);
    setTestResults([]);

    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      
      try {
        const response = await ChatbotService.generateResponse(question);
        
        setTestResults(prev => [...prev, {
          id: i + 1,
          question,
          response,
          timestamp: new Date().toLocaleTimeString(),
          isAI: response.length > 100 && !response.includes('🗑️') && !response.includes('Here\'s how it works:') // Likely AI if longer and not using local patterns
        }]);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        setTestResults(prev => [...prev, {
          id: i + 1,
          question,
          response: `Error: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
          isAI: false,
          isError: true
        }]);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>🤖 ChatBot AI Dynamic Response Test</h1>
        <p style={{ margin: '0 0 10px 0', opacity: 0.9 }}>Testing Google GenAI with gemini-2.5-flash model</p>
        <p style={{ margin: 0, opacity: 0.7, fontSize: '14px' }}>Using VITE_CHAT_MODEL_API key for dynamic responses</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAITest}
          disabled={isLoading}
          style={{
            background: isLoading ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isLoading ? '🔄 Testing AI Responses...' : '🚀 Test Dynamic AI Responses'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {testResults.map((result) => (
          <div 
            key={result.id}
            style={{
              background: 'white',
              border: `2px solid ${result.isError ? '#ef4444' : result.isAI ? '#10b981' : '#f59e0b'}`,
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ 
                background: result.isError ? '#ef4444' : result.isAI ? '#10b981' : '#f59e0b',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {result.isError ? '❌ ERROR' : result.isAI ? '🤖 AI RESPONSE' : '📝 LOCAL RESPONSE'}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{result.timestamp}</span>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#374151' }}>Q: {result.question}</strong>
            </div>
            
            <div style={{ 
              background: '#f9fafb', 
              padding: '12px', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5'
            }}>
              <strong>A:</strong> {result.response}
            </div>
            
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              Response Length: {result.response.length} characters
            </div>
          </div>
        ))}
      </div>

      {isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: '#f0fdf4',
          borderRadius: '12px',
          border: '2px dashed #10b981'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🤖</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>AI is generating dynamic responses...</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Please wait while we test the Gemini AI integration</div>
        </div>
      )}

      {testResults.length === 0 && !isLoading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: '#f8fafc',
          borderRadius: '12px',
          color: '#6b7280'
        }}>
          Click the button above to test if ChatBot gives dynamic AI responses!
        </div>
      )}
    </div>
  );
}