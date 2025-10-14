import { useState, useRef, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  MicrophoneIcon, 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  SparklesIcon,
  PaperAirplaneIcon 
} from "@heroicons/react/24/outline";
import SpeechService from "../services/SpeechService";
import ChatbotService from "../services/ChatbotService";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1,
      sender: "bot", 
      text: "👋 Hello! I'm your Trash2Cash Assistant. I can help you with waste management, smart bins, recycling, and more! How can I assist you today?",
      timestamp: new Date()
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageIdRef = useRef(2);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize voice information when component mounts
  useEffect(() => {
    if (SpeechService.isTTSSupported()) {
      // Wait for voices to load
      setTimeout(() => {
        const voiceInfo = SpeechService.getVoiceInfo();
        console.log('🎤 Voice System Info:', voiceInfo);
        
        if (voiceInfo.bestMaleVoice) {
          console.log('✨ Selected Male Voice:', {
            name: voiceInfo.bestMaleVoice.name,
            lang: voiceInfo.bestMaleVoice.lang
          });
        } else {
          console.log('⚠️ No optimal male voice found, using default voice');
        }
      }, 1000);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (sender, text, isTyping = false) => {
    const newMessage = {
      id: messageIdRef.current++,
      sender,
      text,
      timestamp: new Date(),
      isTyping
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id, text) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, text, isTyping: false } : msg
    ));
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    // Add user message
    addMessage("user", text);
    setInput("");
    setShowSuggestions(false);
    setIsTyping(true);

    try {
      // Add typing indicator
      const typingId = addMessage("bot", "Typing...", true);
      
      // Get AI response
      const reply = await ChatbotService.generateResponse(text);
      
      // Update with actual response
      updateMessage(typingId, reply);
      setIsTyping(false);

      // Speak response if enabled with natural male voice
      if (speechEnabled && SpeechService.isTTSSupported()) {
        setIsSpeaking(true);
        try {
          // Use enhanced natural speech for better conversation feel
          await SpeechService.speakNaturally(reply, { 
            rate: 0.75,   // Slower for more natural conversation
            pitch: 0.85,  // Lower pitch for male voice
            volume: 0.8   // Comfortable volume level
          });
        } catch (error) {
          console.error("TTS error:", error);
          // Fallback to regular speech if enhanced fails
          try {
            await SpeechService.speak(reply, { 
              rate: 0.8, 
              pitch: 0.9, 
              volume: 0.8 
            });
          } catch (fallbackError) {
            console.error("Fallback TTS error:", fallbackError);
          }
        } finally {
          setIsSpeaking(false);
        }
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setIsTyping(false);
      addMessage("bot", "Sorry, I'm having trouble right now. Please try again!");
    }
  };

  const handleVoiceInput = () => {
    try {
      if (!SpeechService.isSupported()) {
        addMessage("bot", "Voice input isn't supported in your browser. Please type your message instead.");
        return;
      }

      if (isListening) {
        SpeechService.stopListening();
        setIsListening(false);
        return;
      }

      setIsListening(true);

      SpeechService.startListening(
        (transcript) => {
          setIsListening(false);
          setInput(transcript);
          // Auto-send voice input
          setTimeout(() => handleSend(transcript), 100);
        },
        (error) => {
          setIsListening(false);
          addMessage("bot", `Voice input error: ${error}`);
        },
        () => setIsListening(false)
      );
    } catch (error) {
      console.error('Voice input error:', error);
      setIsListening(false);
      addMessage("bot", "Voice input failed. Please try typing your message instead.");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    handleSend(suggestion);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      SpeechService.stopSpeaking();
      setIsSpeaking(false);
    }
    setSpeechEnabled(!speechEnabled);
  };

  const testVoice = async () => {
    if (!SpeechService.isTTSSupported()) {
      addMessage("bot", "Voice synthesis is not supported in your browser.");
      return;
    }

    setIsSpeaking(true);
    try {
      const testMessage = "Hello! I'm your Trash2Cash Assistant. I'm here to help you with smart waste management and recycling. How does my voice sound?";
      await SpeechService.speakNaturally(testMessage, {
        rate: 0.75,
        pitch: 0.85,  // Male voice pitch
        volume: 0.8
      });
      addMessage("bot", "🎤 Voice test complete! How did I sound? You can adjust your system volume if needed.");
    } catch (error) {
      console.error("Voice test error:", error);
      addMessage("bot", "Voice test failed. Please check your audio settings.");
    } finally {
      setIsSpeaking(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      sender: "bot", 
      text: "Chat cleared! How can I help you with Trash2Cash today?",
      timestamp: new Date()
    }]);
    setShowSuggestions(true);
    ChatbotService.clearHistory();
    messageIdRef.current = 2;
  };

  const suggestions = ChatbotService.getSuggestedQuestions();

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:shadow-emerald-500/25 transition-all duration-300"
          >
            <ChatBubbleLeftRightIcon className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed bottom-6 right-6 w-96 md:w-[420px] bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 z-50 max-h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Trash2Cash Assistant</h3>
                  <p className="text-emerald-100 text-sm">Smart Waste Management</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={testVoice}
                  disabled={isSpeaking}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Test voice quality"
                >
                  <MicrophoneIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleSpeech}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title={speechEnabled ? "Disable voice" : "Enable voice"}
                >
                  {speechEnabled ? (
                    <SpeakerWaveIcon className="w-5 h-5" />
                  ) : (
                    <SpeakerXMarkIcon className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 bg-gray-50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md"
                        : "bg-white text-gray-800 shadow-sm border border-gray-100"
                    } ${msg.isTyping ? "animate-pulse" : ""}`}
                  >
                    {msg.isTyping ? (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line">{msg.text}</div>
                    )}
                    
                    {!msg.isTyping && (
                      <div className={`text-xs mt-2 opacity-70 ${
                        msg.sender === "user" ? "text-emerald-100" : "text-gray-500"
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Suggestions */}
              {showSuggestions && messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm text-gray-600 font-medium">💡 Try asking:</p>
                  <div className="grid gap-2">
                    {suggestions.slice(0, 4).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none pr-12"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isTyping}
                  />
                  
                  {/* Voice Input Button */}
                  {SpeechService && typeof SpeechService.isSupported === 'function' && SpeechService.isSupported() && (
                    <button
                      onClick={handleVoiceInput}
                      disabled={isTyping}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                        isListening 
                          ? "bg-red-500 text-white animate-pulse" 
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
                      title={isListening ? "Stop listening" : "Voice input"}
                    >
                      <MicrophoneIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-3 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                <div className="flex space-x-4">
                  <span>💬 {messages.length - 1} messages</span>
                  {isListening && <span className="text-red-500 animate-pulse">🎤 Listening...</span>}
                  {isSpeaking && <span className="text-blue-500">🔊 Speaking...</span>}
                </div>
                <button
                  onClick={clearChat}
                  className="hover:text-gray-700 transition-colors"
                >
                  Clear chat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}