import { GoogleGenAI } from '@google/genai';

class ChatbotService {
  constructor() {
    this.genAI = null;
    this.chatHistory = [];
    this.initializeAI();
  }

  initializeAI() {
    try {
      const apiKey = import.meta.env.VITE_CHAT_MODEL_API;
      if (!apiKey) {
        console.warn('⚠️ VITE_CHAT_MODEL_API key not found, using local responses only');
        return;
      }

      console.log('🚀 Initializing Google GenAI with API key...');
      this.genAI = new GoogleGenAI({
        apiKey: apiKey
      });

      console.log('✅ Google GenAI initialized successfully - Dynamic responses enabled!');

      // Initialize with system context
      this.systemContext = `You are Trash2Cash Assistant, a helpful AI chatbot for the Trash2Cash.lk waste management platform in Colombo, Sri Lanka. 

Key features of Trash2Cash:
- Smart IoT bins that monitor waste levels
- Real-time pickup scheduling system
- Connects waste generators with pickup agents
- Google Maps integration for location tracking
- Recycling marketplace for waste materials
- Supports multiple waste types (plastic, glass, metal, organic, paper)
- Mobile-responsive dashboard for all users
- Automated billing and payment system

Be friendly, helpful, and concise. Focus on waste management, recycling, and the platform's features. Always promote environmental sustainability.`;

    } catch (error) {
      console.error('❌ Failed to initialize Google GenAI:', error);
    }
  }

  // Check if AI is initialized and ready
  isAIReady() {
    return !!this.genAI;
  }

  // Get API status for debugging
  getAPIStatus() {
    const chatKey = import.meta.env.VITE_CHAT_MODEL_API;
    
    return {
      hasChatKey: !!chatKey,
      aiInitialized: !!this.genAI,
      chatHistory: this.chatHistory.length
    };
  }

  async generateResponse(userMessage) {
    try {
      if (!this.genAI) {
        console.log('🔄 Using local response (AI not initialized)');
        return this.getLocalResponse(userMessage);
      }

      console.log('🤖 Generating AI response with Google GenAI...');
      
      // Create the prompt with system context
      const prompt = `${this.systemContext}\n\nUser: ${userMessage}\nAssistant:`;
      
      const response = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text;
      console.log('✅ AI response generated successfully');

      // Add to chat history for context
      this.chatHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: text }
      );

      // Keep only last 10 exchanges for performance
      if (this.chatHistory.length > 20) {
        this.chatHistory = this.chatHistory.slice(-20);
      }

      return text;
    } catch (error) {
      console.error('❌ Google GenAI error, falling back to local response:', error);
      return this.getLocalResponse(userMessage);
    }
  }

  getLocalResponse(text) {
    const lowerText = text.toLowerCase();
    
    // Greeting responses
    if (lowerText.match(/^(hello|hi|hey|good morning|good afternoon|good evening)/)) {
      const greetings = [
        "👋 Hello! Welcome to Trash2Cash.lk — your smart waste management partner in Colombo!",
        "Hi there! I'm your Trash2Cash Assistant. How can I help you with waste management today?",
        "Hello! Ready to make waste management smarter and more sustainable? Let me help you!"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // About Trash2Cash
    if (lowerText.includes('what') && (lowerText.includes('trash2cash') || lowerText.includes('platform'))) {
      return "🗑️ Trash2Cash.lk is a smart waste management platform that connects waste generators with pickup agents using IoT-enabled bins, real-time scheduling, and GPS tracking. We make waste collection efficient and promote recycling in Colombo!";
    }

    // How it works
    if (lowerText.includes('how') && (lowerText.includes('work') || lowerText.includes('use'))) {
      return "📱 Here's how it works:\n1. Register as a Customer or Pickup Agent\n2. Install smart bins that monitor waste levels\n3. Schedule pickups through our platform\n4. Track collections in real-time\n5. Earn from recyclable materials\n6. Contribute to a cleaner Colombo! 🌟";
    }

    // Features
    if (lowerText.includes('feature') || lowerText.includes('service')) {
      return "✨ Our key features:\n• 🔧 IoT smart bins with sensors\n• 📍 Real-time GPS tracking\n• 📅 Automated scheduling\n• 💰 Recycling marketplace\n• 📊 Analytics dashboard\n• 📱 Mobile-friendly interface\n• 🔔 Smart notifications";
    }

    // Waste types
    if (lowerText.includes('waste type') || lowerText.includes('material')) {
      return "♻️ We handle multiple waste types:\n• 🥤 Plastic waste\n• 🍺 Glass containers\n• 🥫 Metal materials\n• 🍃 Organic waste\n• 📄 Paper & cardboard\n\nEach type has specific recycling processes and pricing!";
    }

    // Registration
    if (lowerText.includes('register') || lowerText.includes('join') || lowerText.includes('sign up')) {
      return "📝 Ready to join? You can register as:\n• 👥 **Customer** - Schedule waste pickups\n• 🚛 **Pickup Agent** - Collect and earn\n• ♻️ **Recycler** - Process materials\n\nClick the 'Register' button on our homepage to get started!";
    }

    // Location/Map
    if (lowerText.includes('map') || lowerText.includes('location') || lowerText.includes('colombo')) {
      return "📍 We use Google Maps integration to precisely track bin locations and optimize pickup routes across Colombo. This ensures efficient collection and accurate scheduling for all users!";
    }

    // Pricing
    if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('fee')) {
      return "💰 Our pricing is transparent and competitive:\n• Basic service fees for waste collection\n• Earnings from recyclable materials\n• Premium features for businesses\n\nContact our team for detailed pricing based on your needs!";
    }

    // Contact/Support
    if (lowerText.includes('contact') || lowerText.includes('support') || lowerText.includes('help')) {
      return "🤝 Need help? We're here for you!\n• 📧 Email support team\n• 📞 Call customer service\n• 💬 Live chat (right here!)\n• 📱 Mobile app support\n\nOur team responds within 24 hours!";
    }

    // Environmental impact
    if (lowerText.includes('environment') || lowerText.includes('green') || lowerText.includes('sustainable')) {
      return "🌱 Environmental impact is our priority!\n• Reduces landfill waste\n• Promotes recycling culture\n• Optimizes collection routes (less fuel)\n• Tracks sustainability metrics\n• Supports circular economy\n\nTogether, we're building a greener Colombo! 🌍";
    }

    // Technology
    if (lowerText.includes('technology') || lowerText.includes('iot') || lowerText.includes('smart')) {
      return "🔬 Our smart technology includes:\n• IoT sensors for bin monitoring\n• Real-time data analytics\n• GPS tracking systems\n• Mobile-responsive web platform\n• Automated notifications\n• Machine learning for optimization\n\nTechnology meets sustainability! 🚀";
    }

    // Thank you
    if (lowerText.includes('thank') || lowerText.includes('thanks')) {
      return "🙏 You're very welcome! Thank you for choosing Trash2Cash and contributing to a cleaner, more sustainable Colombo. Happy recycling! 💚♻️";
    }

    // Goodbye
    if (lowerText.includes('bye') || lowerText.includes('goodbye') || lowerText.includes('see you')) {
      return "👋 Goodbye! Remember, every small action contributes to a cleaner environment. Visit us anytime for smart waste management solutions! 🌟";
    }

    // Default response
    const defaultResponses = [
      "🤔 I'm here to help with Trash2Cash questions! Ask me about our smart bins, pickup scheduling, recycling, or how to get started!",
      "💡 I can tell you about waste management, our IoT technology, pricing, registration, or environmental impact. What interests you?",
      "🗑️ As your Trash2Cash Assistant, I'm ready to discuss waste collection, recycling marketplace, smart features, or sustainability. How can I help?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Clear chat history
  clearHistory() {
    this.chatHistory = [];
  }

  // Get suggested questions
  getSuggestedQuestions() {
    return [
      "What is Trash2Cash?",
      "How does the smart bin system work?",
      "What waste types do you accept?",
      "How can I register as a customer?",
      "What are your environmental benefits?",
      "How does pricing work?",
      "Where do you operate in Colombo?"
    ];
  }
}

export default new ChatbotService();