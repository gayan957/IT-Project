import { GoogleGenAI } from '@google/genai';

class ChatbotService {
  constructor() {
    this.genAI = null;
    this.chatHistory = [];
    this.knowledgeBase = this.loadKnowledgeBase();
    this.initializeAI();
  }

  // Load comprehensive knowledge base
  loadKnowledgeBase() {
    return {
      // Core Platform Information
      platform: {
        name: "Trash2Cash.lk",
        description: "A web-based digital platform designed to formalize and modernize Sri Lanka's recyclable waste management",
        goal: "Create a Smart Waste Collection Network for Sri Lanka",
        location: "Colombo, Sri Lanka"
      },

      // User Roles and Stakeholders
      userRoles: {
        customers: {
          description: "Households & Businesses - generators of recyclable waste",
          functions: ["Schedule pickups", "Monitor smart bins", "Track earnings", "Ensure responsible waste handling"]
        },
        pickupAgents: {
          description: "Drivers/Collectors - individuals who physically collect waste",
          functions: ["Optimized routes", "Clear schedules", "Track earnings and commissions"]
        },
        pickupPartners: {
          description: "Licensed Collectors - companies managing pickup agents",
          functions: ["Fleet management", "Track collection volumes", "Handle complaints", "Oversee revenue"]
        },
        recyclers: {
          description: "End-buyers of collected materials",
          functions: ["Find quality-certified recyclable waste", "Consistent supply", "Bulk ordering"]
        },
        administrators: {
          description: "Platform operators",
          functions: ["Manage user accounts", "Set waste prices", "Monitor system activity", "Ensure smooth operation"]
        }
      },

      // Core System Modules
      modules: {
        binManagement: {
          smartBins: "IoT-enabled bins with ultrasonic sensors for real-time waste level monitoring",
          automatedNotifications: "Auto-notify users and agents when bins reach optimal capacity",
          manualScheduling: "Manual pickup scheduling for users without smart bins",
          liveMapView: "Real-time map showing full/nearly-full bins for pickup agents"
        },
        financeManagement: {
          transparentPayments: "Automatic calculation based on weight and waste type using current market rates",
          digitalTransactions: "Stripe API integration for digital wallets and bank transfers",
          automatedCommissions: "Automatic commission calculation and deposits for pickup agents",
          financialReporting: "Comprehensive reports for transactions, revenue, and commissions"
        },
        agentManagement: {
          registration: "Register agents with unique IDs and route assignments",
          performanceTracking: "Monitor pickup metrics, weight collected, customer satisfaction, on-time performance",
          complaintResolution: "Direct complaint routing to responsible Pickup Partners"
        },
        wasteManagement: {
          inventoryDashboard: "Real-time inventory of available recyclable materials",
          structuredOrdering: "Bulk order placement system for recyclers",
          qualityGrade: "Detailed waste type, quantity, quality grade, and location information"
        },
        systemManagement: {
          userRoleManagement: "Centralized control for all user accounts and roles",
          pricingControl: "Market rate setting and updates based on commodity prices",
          systemConfiguration: "Platform-wide settings and policy customization"
        }
      },

      // Technical Specifications
      technical: {
        architecture: "MERN Stack (MongoDB, Express.js, React.js, Node.js)",
        authentication: "JWT (JSON Web Tokens) for secure session management",
        iot: {
          microcontroller: "ESP32 modules for Wi-Fi enabled data transmission",
          sensors: "Ultrasonic sensors for fill-level detection"
        },
        apis: {
          payment: "Stripe API for secure digital payment processing",
          maps: "Google Maps API for route optimization and live displays"
        },
        methodology: "Agile Software Engineering with iterative sprints"
      },

      // Problems Solved
      problems: {
        transparency: "Lacks transparency, structure, and trust in informal waste collection",
        scheduling: "Diesel trucks operate without schedules",
        pricing: "Unregulated pricing with no accountability",
        environmental: "Noise and air pollution, unsafe handling of hazardous materials",
        efficiency: "Inefficient recycling processes"
      },

      // Waste Types
      wasteTypes: ["Plastic waste", "Glass containers", "Metal materials", "Organic waste", "Paper & cardboard"],

      // Environmental Benefits
      environmentalBenefits: [
        "Reduces landfill waste",
        "Promotes recycling culture", 
        "Optimizes collection routes (less fuel consumption)",
        "Tracks sustainability metrics",
        "Supports circular economy",
        "Building a greener Colombo"
      ]
    };
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

      // Initialize with comprehensive system context from knowledge base
      this.systemContext = `You are Trash2Cash Assistant, a knowledgeable AI chatbot for the Trash2Cash.lk waste management platform in Colombo, Sri Lanka.

COMPREHENSIVE PLATFORM KNOWLEDGE:

PLATFORM OVERVIEW:
Trash2Cash.lk is a web-based digital platform that formalizes and modernizes Sri Lanka's recyclable waste management. It connects households and businesses with verified Pickup Agents and certified Recyclers through a structured, transparent, and efficient ecosystem. Our goal is to create a "Smart Waste Collection Network" for Sri Lanka.

USER ROLES:
1. CUSTOMERS (Households & Businesses): Schedule pickups, monitor smart bins, track earnings, ensure responsible waste handling
2. PICKUP AGENTS (Drivers/Collectors): Get optimized routes, clear schedules, track earnings and commissions
3. PICKUP PARTNERS (Licensed Collectors): Manage fleet, track collection volumes, handle complaints, oversee revenue
4. RECYCLERS (End-buyers): Find quality-certified recyclable waste, consistent supply, bulk ordering capabilities
5. ADMINISTRATORS: Manage user accounts, set waste prices, monitor system activity, ensure smooth operation

CORE MODULES:
• BIN MANAGEMENT: IoT smart bins with ultrasonic sensors, automated notifications, manual scheduling, live map view
• FINANCE MANAGEMENT: Transparent payments, Stripe API integration, automated commissions, financial reporting
• AGENT MANAGEMENT: Performance tracking, complaint resolution, route optimization
• WASTE MANAGEMENT: Real-time inventory, structured ordering, quality grading
• SYSTEM MANAGEMENT: User roles, pricing control, system configuration

TECHNICAL STACK:
- MERN Stack (MongoDB, Express.js, React.js, Node.js)
- JWT authentication for security
- ESP32 microcontrollers with ultrasonic sensors for IoT bins
- Stripe API for payments, Google Maps API for routing
- Agile development methodology

WASTE TYPES SUPPORTED:
Plastic, Glass, Metal, Organic waste, Paper & cardboard

ENVIRONMENTAL IMPACT:
Reduces landfill waste, promotes recycling culture, optimizes routes (less fuel), tracks sustainability metrics, supports circular economy

PROBLEMS WE SOLVE:
- Lack of transparency in informal waste collection
- Unscheduled diesel truck operations
- Unregulated pricing with no accountability
- Environmental pollution from inefficient processes
- Unsafe handling of hazardous materials

Be expert-level knowledgeable, friendly, helpful, and detailed. Provide specific technical information when asked. Always promote environmental sustainability and explain how Trash2Cash creates value for all stakeholders.`;

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
        `👋 Hello! Welcome to ${this.knowledgeBase.platform.name} — your smart waste management partner in ${this.knowledgeBase.platform.location}!`,
        "Hi there! I'm your Trash2Cash Assistant. How can I help you with waste management today?",
        "Hello! Ready to make waste management smarter and more sustainable? Let me help you!"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // About Trash2Cash - Enhanced with knowledge base
    if (lowerText.includes('what') && (lowerText.includes('trash2cash') || lowerText.includes('platform'))) {
      return `🗑️ ${this.knowledgeBase.platform.description}. Our goal: ${this.knowledgeBase.platform.goal}. We solve problems like lack of transparency, unscheduled operations, and unregulated pricing in Sri Lanka's waste collection industry. We make waste collection efficient and promote recycling across Colombo!`;
    }

    // How it works - Enhanced with detailed user roles
    if (lowerText.includes('how') && (lowerText.includes('work') || lowerText.includes('use'))) {
      return `📱 Here's how Trash2Cash works:\n\n🏠 **For Customers:** Register → Get IoT smart bins → Auto-notifications when full → Earn from recyclables\n🚛 **For Pickup Agents:** Get optimized routes → Clear schedules → Track earnings\n🏢 **For Partners:** Manage fleet → Track volumes → Handle complaints\n♻️ **For Recyclers:** View inventory → Place bulk orders → Quality-certified materials\n\n${this.knowledgeBase.technical.architecture} powers our platform! 🌟`;
    }

    // Features - Enhanced with detailed modules
    if (lowerText.includes('feature') || lowerText.includes('service') || lowerText.includes('module')) {
      return `✨ **Our 5 Core Modules:**\n\n�️ **BIN MANAGEMENT:** ${this.knowledgeBase.modules.binManagement.smartBins}\n💰 **FINANCE:** ${this.knowledgeBase.modules.financeManagement.transparentPayments}\n👥 **AGENT MANAGEMENT:** ${this.knowledgeBase.modules.agentManagement.performanceTracking}\n♻️ **WASTE MANAGEMENT:** ${this.knowledgeBase.modules.wasteManagement.inventoryDashboard}\n⚙️ **SYSTEM MANAGEMENT:** ${this.knowledgeBase.modules.systemManagement.userRoleManagement}\n\n**Tech Stack:** ${this.knowledgeBase.technical.architecture}`;
    }

    // Waste types - Enhanced with knowledge base data
    if (lowerText.includes('waste type') || lowerText.includes('material')) {
      const types = this.knowledgeBase.wasteTypes.map((type, idx) => `• ${['🥤', '🍺', '🥫', '🍃', '📄'][idx]} ${type}`).join('\n');
      return `♻️ **We handle these waste types:**\n${types}\n\nEach type has specific recycling processes and market-based pricing set by our administrators!`;
    }

    // Registration - Enhanced with detailed user roles
    if (lowerText.includes('register') || lowerText.includes('join') || lowerText.includes('sign up') || lowerText.includes('user role')) {
      return `📝 **Join our Smart Waste Network! Choose your role:**\n\n👥 **CUSTOMER** (${this.knowledgeBase.userRoles.customers.description}):\n${this.knowledgeBase.userRoles.customers.functions.map(f => `   • ${f}`).join('\n')}\n\n🚛 **PICKUP AGENT** (${this.knowledgeBase.userRoles.pickupAgents.description}):\n${this.knowledgeBase.userRoles.pickupAgents.functions.map(f => `   • ${f}`).join('\n')}\n\n🏢 **PICKUP PARTNER** (${this.knowledgeBase.userRoles.pickupPartners.description})\n♻️ **RECYCLER** (${this.knowledgeBase.userRoles.recyclers.description})\n\nClick 'Register' to get started! 🌟`;
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

    // Environmental impact - Enhanced with knowledge base benefits
    if (lowerText.includes('environment') || lowerText.includes('green') || lowerText.includes('sustainable') || lowerText.includes('benefits')) {
      const benefits = this.knowledgeBase.environmentalBenefits.map(benefit => `• ${benefit}`).join('\n');
      return `🌱 **Environmental Impact - Our Core Mission:**\n\n**We Solve Critical Problems:**\n• ${Object.values(this.knowledgeBase.problems).join('\n• ')}\n\n**Our Environmental Benefits:**\n${benefits}\n\nTogether, we're ${this.knowledgeBase.environmentalBenefits[5]}! 🌍`;
    }

    // Technology - Enhanced with technical specifications
    if (lowerText.includes('technology') || lowerText.includes('iot') || lowerText.includes('smart') || lowerText.includes('technical') || lowerText.includes('tech stack')) {
      return `🔬 **Our Technical Excellence:**\n\n**Architecture:** ${this.knowledgeBase.technical.architecture}\n**Security:** ${this.knowledgeBase.technical.authentication}\n\n**IoT Integration:**\n• **Hardware:** ${this.knowledgeBase.technical.iot.microcontroller}\n• **Sensors:** ${this.knowledgeBase.technical.iot.sensors}\n\n**API Integrations:**\n• **Payments:** ${this.knowledgeBase.technical.apis.payment}\n• **Mapping:** ${this.knowledgeBase.technical.apis.maps}\n\n**Development:** ${this.knowledgeBase.technical.methodology}\n\nTechnology meets sustainability! 🚀`;
    }

    // Thank you
    if (lowerText.includes('thank') || lowerText.includes('thanks')) {
      return "🙏 You're very welcome! Thank you for choosing Trash2Cash and contributing to a cleaner, more sustainable Colombo. Happy recycling! 💚♻️";
    }

    // Goodbye
    if (lowerText.includes('bye') || lowerText.includes('goodbye') || lowerText.includes('see you')) {
      return "👋 Goodbye! Remember, every small action contributes to a cleaner environment. Visit us anytime for smart waste management solutions! 🌟";
    }

    // Smart bins specific queries
    if (lowerText.includes('smart bin') || lowerText.includes('iot bin') || lowerText.includes('sensor')) {
      return `🗑️ **Smart IoT Bins - Our Core Innovation:**\n\n**Technology:** ${this.knowledgeBase.modules.binManagement.smartBins}\n\n**Features:**\n• ${this.knowledgeBase.modules.binManagement.automatedNotifications}\n• ${this.knowledgeBase.modules.binManagement.liveMapView}\n• Real-time monitoring prevents overflow\n• Optimized pickup routes save fuel\n\n**Hardware:** ${this.knowledgeBase.technical.iot.microcontroller} with ${this.knowledgeBase.technical.iot.sensors}\n\nSmart bins revolutionize waste management! 🚀`;
    }

    // Payment and pricing queries
    if (lowerText.includes('payment') || lowerText.includes('billing') || lowerText.includes('money') || lowerText.includes('earn')) {
      return `💰 **Financial System - Transparent & Fair:**\n\n**Payment Process:**\n• ${this.knowledgeBase.modules.financeManagement.transparentPayments}\n• ${this.knowledgeBase.modules.financeManagement.digitalTransactions}\n• ${this.knowledgeBase.modules.financeManagement.automatedCommissions}\n\n**Reporting:** ${this.knowledgeBase.modules.financeManagement.financialReporting}\n\n**Security:** Powered by ${this.knowledgeBase.technical.apis.payment}\n\nEarn money while saving the environment! 💚`;
    }

    // Admin and management queries
    if (lowerText.includes('admin') || lowerText.includes('management') || lowerText.includes('control')) {
      return `⚙️ **Administrator Functions:**\n\n**User Management:** ${this.knowledgeBase.modules.systemManagement.userRoleManagement}\n**Pricing Control:** ${this.knowledgeBase.modules.systemManagement.pricingControl}\n**System Config:** ${this.knowledgeBase.modules.systemManagement.systemConfiguration}\n\n**Performance Tracking:** ${this.knowledgeBase.modules.agentManagement.performanceTracking}\n**Complaint Resolution:** ${this.knowledgeBase.modules.agentManagement.complaintResolution}\n\nPowerful tools for effective platform management! 🎯`;
    }

    // Problems we solve
    if (lowerText.includes('problem') || lowerText.includes('issue') || lowerText.includes('challenge') || lowerText.includes('why')) {
      const problems = Object.values(this.knowledgeBase.problems).map(problem => `• ${problem}`).join('\n');
      return `🚨 **Problems We Solve in Sri Lanka's Waste Industry:**\n\n${problems}\n\n**Our Solution:** ${this.knowledgeBase.platform.description}\n\n**Result:** A transparent, efficient, and environmentally friendly waste management ecosystem! ✅`;
    }

    // Default response
    const defaultResponses = [
      `🤔 I'm here to help with ${this.knowledgeBase.platform.name} questions! Ask me about our smart bins, pickup scheduling, recycling, user roles, or how to get started!`,
      `💡 I can tell you about our ${Object.keys(this.knowledgeBase.modules).length} core modules, ${this.knowledgeBase.technical.architecture} architecture, pricing, registration, or environmental impact. What interests you?`,
      `🗑️ As your Trash2Cash Assistant, I'm ready to discuss waste collection, recycling marketplace, smart features, sustainability, or technical specifications. How can I help?`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Clear chat history
  clearHistory() {
    this.chatHistory = [];
  }

  // Get knowledge base info for debugging
  getKnowledgeBaseInfo() {
    return {
      modules: Object.keys(this.knowledgeBase.modules).length,
      userRoles: Object.keys(this.knowledgeBase.userRoles).length,
      wasteTypes: this.knowledgeBase.wasteTypes.length,
      environmentalBenefits: this.knowledgeBase.environmentalBenefits.length,
      problems: Object.keys(this.knowledgeBase.problems).length,
      platform: this.knowledgeBase.platform.name
    };
  }

  // Get suggested questions - Enhanced with knowledge base topics
  getSuggestedQuestions() {
    return [
      "What is Trash2Cash and how does it work?",
      "Tell me about the smart IoT bins and sensors",
      "What are the 5 user roles in the platform?",
      "How does the payment and billing system work?",
      "What problems does Trash2Cash solve in Sri Lanka?",
      "What technologies power the platform?",
      "What are the environmental benefits?",
      "How do pickup agents get optimized routes?",
      "Tell me about the MERN stack architecture",
      "What waste types do you accept?",
      "How can recyclers place bulk orders?",
      "What are the core system modules?"
    ];
  }
}

export default new ChatbotService();