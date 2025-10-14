class SpeechService {
  constructor() {
    this.recognition = null;
    this.speechSynthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
  }

  // Initialize speech recognition
  initializeRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    return this.recognition;
  }

  // Start listening for speech
  startListening(onResult, onError, onEnd) {
    try {
      if (!this.recognition) {
        this.initializeRecognition();
      }

      this.isListening = true;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        let errorMessage = 'Speech recognition error';
        
        switch(event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied.';
            break;
          case 'network':
            errorMessage = 'Network error occurred.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        onError(errorMessage);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      onError('Failed to start speech recognition: ' + error.message);
    }
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Text to speech with enhanced natural voice
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any ongoing speech
      this.stopSpeaking();

      // Clean and prepare text for more natural speech
      const cleanText = this.prepareTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Configure voice options for more natural, fluid speech
      utterance.rate = options.rate || 0.85; // Slightly slower for more natural feel
      utterance.pitch = options.pitch || 0.9; // Slightly lower for male voice
      utterance.volume = options.volume || 0.9; // Slightly lower for comfort
      utterance.lang = options.lang || 'en-US';

      // Find the best male voice available
      const bestVoice = this.getBestMaleVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
        console.log(`🎤 Using voice: ${bestVoice.name} (${bestVoice.lang})`);
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        reject(new Error('Speech synthesis error: ' + event.error));
      };

      // Add small delay for better browser compatibility
      setTimeout(() => {
        this.speechSynthesis.speak(utterance);
      }, 100);
    });
  }

  // Prepare text for more natural speech
  prepareTextForSpeech(text) {
    return text
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code blocks
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      // Clean up special characters and emojis for speech
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis using Unicode ranges
      // Replace bullet points with pauses
      .replace(/•\s/g, '. ')
      .replace(/\n•/g, '. ')
      // Add natural pauses
      .replace(/\n\n/g, '. ')
      .replace(/\n/g, '. ')
      // Clean up multiple spaces and periods
      .replace(/\.\s*\./g, '.')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Find the best male voice available
  getBestMaleVoice() {
    const voices = this.speechSynthesis.getVoices();
    
    // Priority order for male voices (most natural to least)
    const maleVoicePriority = [
      // High-quality Google/Chrome voices
      'Google UK English Male',
      'Google US English Male',
      'Chrome Male',
      // Microsoft voices (Windows)
      'Microsoft David Desktop',
      'Microsoft Mark Mobile',
      'Microsoft Richard Desktop',
      // Apple voices (macOS/iOS)
      'Daniel',
      'Alex',
      'Tom',
      'Fred',
      'Ralph',
      // General patterns for male voices
      'Male',
      'Man'
    ];

    // First, try to find exact matches from priority list
    for (const preferredName of maleVoicePriority) {
      const voice = voices.find(v => 
        v.name === preferredName && 
        v.lang.startsWith('en')
      );
      if (voice) return voice;
    }

    // Then try pattern matching for male voices
    const maleVoice = voices.find(voice => 
      voice.lang.startsWith('en') && (
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('daniel') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.name.toLowerCase().includes('mark') ||
        voice.name.toLowerCase().includes('richard') ||
        voice.name.toLowerCase().includes('tom') ||
        voice.name.toLowerCase().includes('fred') ||
        voice.name.toLowerCase().includes('ralph')
      )
    );

    if (maleVoice) return maleVoice;

    // Fallback to any English voice
    return voices.find(voice => voice.lang.startsWith('en')) || null;
  }

  // Stop speaking
  stopSpeaking() {
    if (this.speechSynthesis && this.isSpeaking) {
      this.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  // Check if speech recognition is supported (instance method)
  isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // Check if text-to-speech is supported (instance method)
  isTTSSupported() {
    return 'speechSynthesis' in window;
  }

  // Check if speech recognition is supported (static method)
  static isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // Check if text-to-speech is supported (static method)
  static isTTSSupported() {
    return 'speechSynthesis' in window;
  }

  // Get available voices
  getVoices() {
    return this.speechSynthesis ? this.speechSynthesis.getVoices() : [];
  }

  // Get detailed voice information for debugging
  getVoiceInfo() {
    const voices = this.getVoices();
    const maleVoices = voices.filter(voice => 
      voice.lang.startsWith('en') && (
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('david') ||
        voice.name.toLowerCase().includes('daniel') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.name.toLowerCase().includes('mark') ||
        voice.name.toLowerCase().includes('richard') ||
        voice.name.toLowerCase().includes('tom') ||
        voice.name.toLowerCase().includes('fred') ||
        voice.name.toLowerCase().includes('ralph')
      )
    );

    return {
      totalVoices: voices.length,
      englishVoices: voices.filter(v => v.lang.startsWith('en')).length,
      maleVoices: maleVoices.length,
      bestMaleVoice: this.getBestMaleVoice(),
      availableMaleVoices: maleVoices.map(v => ({ name: v.name, lang: v.lang }))
    };
  }

  // Speak with enhanced natural pauses and emotion
  speakNaturally(text, options = {}) {
    // Add natural speech patterns
    const enhancedText = this.addNaturalSpeechPatterns(text);
    
    return this.speak(enhancedText, {
      rate: 0.8, // Slower for more natural conversation
      pitch: 1.15, // Higher for feminine voice
      volume: 0.85,
      ...options
    });
  }

  // Add natural speech patterns for more human-like delivery
  addNaturalSpeechPatterns(text) {
    return text
      // Add pauses before important information
      .replace(/(\d+\.|\*\*|###)/g, '. $1')
      // Add emphasis pauses
      .replace(/(Important|Note|Remember|However|Additionally)/gi, '... $1')
      // Natural conversation starters
      .replace(/^(Let me|I can|Here's)/i, '$1...')
      // Question responses
      .replace(/^(Yes|No|Sure|Absolutely)/i, '$1,')
      // Lists with natural pauses
      .replace(/(\d+\.\s)/g, '$1... ')
      // Breathing pauses in long sentences
      .replace(/([.!?])\s+([A-Z])/g, '$1 ... $2');
  }
}

export default new SpeechService();