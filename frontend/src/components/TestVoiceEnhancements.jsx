import { useState, useEffect } from 'react';
import SpeechService from '../services/SpeechService';

export default function TestVoiceEnhancements() {
  const [voiceInfo, setVoiceInfo] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    // Load voice information when component mounts
    if (SpeechService.isTTSSupported()) {
      setTimeout(() => {
        const info = SpeechService.getVoiceInfo();
        setVoiceInfo(info);
        console.log('🎤 Voice Information:', info);
      }, 1000); // Wait for voices to load
    }
  }, []);

  const testMessages = [
    {
      name: "Natural Greeting",
      text: "Hello! I'm your Trash2Cash Assistant. I'm here to help you with smart waste management and recycling!"
    },
    {
      name: "Technical Information",
      text: "Our platform uses IoT-enabled smart bins with ultrasonic sensors for real-time waste level monitoring. The system is built on MERN stack architecture."
    },
    {
      name: "Environmental Impact",
      text: "We help reduce landfill waste, promote recycling culture, and optimize collection routes. Together, we're building a greener Colombo!"
    },
    {
      name: "User Guidance",
      text: "You can register as a Customer to schedule pickups, or as a Pickup Agent to collect and earn. Our platform connects all stakeholders efficiently."
    },
    {
      name: "Conversational Response",
      text: "That's a great question! Let me explain how our smart bin system works. When bins reach optimal capacity, they automatically notify pickup agents."
    }
  ];

  const testVoiceQuality = async (message, enhanced = false) => {
    setIsTesting(true);
    const startTime = Date.now();
    
    try {
      if (enhanced) {
        await SpeechService.speakNaturally(message.text);
      } else {
        await SpeechService.speak(message.text, { 
          rate: 1.0, 
          pitch: 1.0, 
          volume: 1.0 
        });
      }
      
      const duration = Date.now() - startTime;
      const result = {
        message: message.name,
        enhanced,
        duration,
        success: true,
        timestamp: new Date()
      };
      
      setTestResults(prev => [...prev, result]);
      console.log(`✅ Voice test completed: ${message.name} (${enhanced ? 'Enhanced' : 'Standard'}) - ${duration}ms`);
    } catch (error) {
      console.error('❌ Voice test failed:', error);
      setTestResults(prev => [...prev, {
        message: message.name,
        enhanced,
        success: false,
        error: error.message,
        timestamp: new Date()
      }]);
    } finally {
      setIsTesting(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    setIsTesting(true);
    
    for (const message of testMessages) {
      console.log(`🧪 Testing: ${message.name}`);
      
      // Test standard voice
      await testVoiceQuality(message, false);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test enhanced voice
      await testVoiceQuality(message, true);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setIsTesting(false);
  };

  const stopSpeaking = () => {
    SpeechService.stopSpeaking();
    setIsTesting(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🎤 Enhanced Voice System Testing
        </h1>
        <p className="text-gray-600">
          Testing the natural, fluid male voice enhancements for Trash2Cash ChatBot
        </p>
      </div>

      {/* Voice Information */}
      {voiceInfo && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">🔍 Voice System Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-gray-700">Total Voices</h3>
              <p className="text-2xl font-bold text-blue-600">{voiceInfo.totalVoices}</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-gray-700">English Voices</h3>
              <p className="text-2xl font-bold text-green-600">{voiceInfo.englishVoices}</p>
            </div>
            <div className="bg-white p-4 rounded border">
              <h3 className="font-medium text-gray-700">Male Voices</h3>
              <p className="text-2xl font-bold text-blue-600">{voiceInfo.maleVoices}</p>
            </div>
          </div>
          
          {voiceInfo.bestMaleVoice && (
            <div className="mt-4 p-4 bg-green-50 rounded border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">✨ Selected Male Voice:</h3>
              <p className="text-green-700">
                <strong>{voiceInfo.bestMaleVoice.name}</strong> ({voiceInfo.bestMaleVoice.lang})
              </p>
            </div>
          )}

          {voiceInfo.availableMaleVoices.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Available Male Voices:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {voiceInfo.availableMaleVoices.map((voice, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                    <strong>{voice.name}</strong> <span className="text-gray-500">({voice.lang})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Controls */}
      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        <button
          onClick={runAllTests}
          disabled={isTesting}
          className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-lg hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isTesting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Running Voice Tests...</span>
            </div>
          ) : (
            "🧪 Run All Voice Tests"
          )}
        </button>

        <button
          onClick={stopSpeaking}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          🛑 Stop Speaking
        </button>
      </div>

      {/* Individual Test Messages */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Individual Voice Tests</h2>
        <div className="grid gap-4">
          {testMessages.map((message, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">{message.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => testVoiceQuality(message, false)}
                    disabled={isTesting}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    Standard Voice
                  </button>
                  <button
                    onClick={() => testVoiceQuality(message, true)}
                    disabled={isTesting}
                    className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:opacity-50 transition-colors"
                  >
                    ✨ Enhanced Voice
                  </button>
                </div>
              </div>
              <p className="text-gray-600 text-sm">{message.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📊 Test Results ({testResults.length} tests completed)
          </h2>
          <div className="space-y-3">
            {testResults.map((result, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{result.message}</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      result.enhanced 
                        ? 'bg-purple-200 text-purple-800' 
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {result.enhanced ? '✨ Enhanced' : 'Standard'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {result.success ? (
                      <span className="text-green-600">
                        ✅ {result.duration}ms
                      </span>
                    ) : (
                      <span className="text-red-600">
                        ❌ Failed: {result.error}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhancement Features */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <h2 className="text-xl font-semibold text-purple-800 mb-4">✨ Voice Enhancement Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-purple-700 mb-2">🎯 Voice Selection Priority:</h3>
            <ul className="text-sm text-purple-600 space-y-1">
              <li>• Google UK/US English Male</li>
              <li>• Microsoft David/Richard (Windows)</li>
              <li>• Daniel/Alex/Tom (macOS/iOS)</li>
              <li>• Chrome Male voices</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-purple-700 mb-2">🎨 Enhancement Settings:</h3>
            <ul className="text-sm text-purple-600 space-y-1">
              <li>• Rate: 0.75-0.85 (slower, more natural)</li>
              <li>• Pitch: 0.85-0.9 (lower for male voice)</li>
              <li>• Volume: 0.8-0.9 (comfortable level)</li>
              <li>• Natural pauses and emphasis</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="font-medium text-purple-700 mb-2">🧹 Text Processing:</h3>
          <ul className="text-sm text-purple-600 space-y-1">
            <li>• Removes markdown formatting (bold, italic, code blocks)</li>
            <li>• Strips emojis and special characters</li>
            <li>• Adds natural speech pauses and emphasis</li>
            <li>• Converts bullet points to spoken sentences</li>
          </ul>
        </div>
      </div>
    </div>
  );
}