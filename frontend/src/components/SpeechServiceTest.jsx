import SpeechService from '../services/SpeechService';

// Test SpeechService functionality
console.log('🧪 Testing SpeechService...');

try {
  // Test if SpeechService is imported correctly
  console.log('SpeechService object:', SpeechService);
  
  // Test isSupported method
  if (typeof SpeechService.isSupported === 'function') {
    const isSupported = SpeechService.isSupported();
    console.log('✅ isSupported method works:', isSupported);
  } else {
    console.error('❌ isSupported method not found');
  }
  
  // Test isTTSSupported method
  if (typeof SpeechService.isTTSSupported === 'function') {
    const isTTSSupported = SpeechService.isTTSSupported();
    console.log('✅ isTTSSupported method works:', isTTSSupported);
  } else {
    console.error('❌ isTTSSupported method not found');
  }
  
  // Test object methods
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(SpeechService)));
  
} catch (error) {
  console.error('❌ SpeechService test failed:', error);
}

export default function SpeechServiceTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>SpeechService Test Results</h2>
      <p>Check browser console for test results</p>
      <div>
        <p><strong>Speech Recognition Supported:</strong> {SpeechService.isSupported() ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Text-to-Speech Supported:</strong> {SpeechService.isTTSSupported() ? '✅ Yes' : '❌ No'}</p>
      </div>
    </div>
  );
}