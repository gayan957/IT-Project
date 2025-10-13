import { useState } from 'react';
import { ChatBubbleLeftRightIcon, SparklesIcon, MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

export default function ChatBotDemo() {
  const [showFeatures, setShowFeatures] = useState(false);

  const features = [
    {
      icon: "🤖",
      title: "AI-Powered Responses",
      description: "Uses Google Gemini AI for intelligent, context-aware conversations about waste management"
    },
    {
      icon: "🎤",
      title: "Voice Input",
      description: "Speak your questions naturally using advanced speech recognition technology"
    },
    {
      icon: "🔊",
      title: "Text-to-Speech",
      description: "Hear responses read aloud with high-quality voice synthesis"
    },
    {
      icon: "💡",
      title: "Smart Suggestions",
      description: "Get helpful conversation starters and topic suggestions"
    },
    {
      icon: "📱",
      title: "Responsive Design",
      description: "Works perfectly on desktop, tablet, and mobile devices"
    },
    {
      icon: "⚡",
      title: "Real-time Typing",
      description: "See typing indicators and smooth animations for natural conversation flow"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full mb-6">
            <ChatBubbleLeftRightIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Meet Your <span className="text-emerald-600">Trash2Cash</span> Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience next-generation customer support with our AI-powered chatbot. 
            Get instant help with waste management, smart bins, recycling, and more!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-md">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">ChatBot is active</span>
            </div>
            <button
              onClick={() => setShowFeatures(!showFeatures)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors"
            >
              {showFeatures ? 'Hide Features' : 'View Features'}
            </button>
          </div>
        </div>

        {/* Features Grid */}
        {showFeatures && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* How to Use */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            How to Use the ChatBot
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Open Chat</h3>
              <p className="text-gray-600">Click the floating chat button in the bottom-right corner to start</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MicrophoneIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Ask Questions</h3>
              <p className="text-gray-600">Type or speak your questions about Trash2Cash services</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Get Smart Answers</h3>
              <p className="text-gray-600">Receive intelligent, helpful responses powered by AI</p>
            </div>
          </div>
        </div>

        {/* Sample Questions */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-3xl p-8 text-white">
          <h2 className="text-3xl font-bold text-center mb-8">Try These Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">🗑️ Waste Management</h3>
              <div className="space-y-2">
                <p className="bg-white/10 p-3 rounded-lg">"What is Trash2Cash?"</p>
                <p className="bg-white/10 p-3 rounded-lg">"How do smart bins work?"</p>
                <p className="bg-white/10 p-3 rounded-lg">"What waste types do you accept?"</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">🚀 Getting Started</h3>
              <div className="space-y-2">
                <p className="bg-white/10 p-3 rounded-lg">"How can I register?"</p>
                <p className="bg-white/10 p-3 rounded-lg">"How does pricing work?"</p>
                <p className="bg-white/10 p-3 rounded-lg">"Where do you operate?"</p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-emerald-100 text-lg">
              💬 <strong>Tip:</strong> Look for the chat bubble in the bottom-right corner!
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-6">
              The ChatBot is ready to help you with any questions about our smart waste management platform.
            </p>
            <div className="flex justify-center">
              <div className="animate-bounce">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              👆 Click the chat button to start your conversation!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}