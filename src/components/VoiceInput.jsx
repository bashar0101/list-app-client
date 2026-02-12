import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

const VoiceInput = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      processText(text);
    };

    recognition.onerror = (event) => {
      setError('Error occurred in recognition: ' + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processText = (text) => {
    console.log('Recognized text:', text);
    const lowercaseText = text.toLowerCase();
    
    // Simple NLP logic
    let type = 'spent';
    if (lowercaseText.includes('got') || lowercaseText.includes('received') || lowercaseText.includes('income')) {
      type = 'got';
    }

    const amountMatch = lowercaseText.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[1]) : 0;

    let description = text;
    // Remove "I spent", "I got", "dollars", etc. to clean up description
    description = description.replace(/i spent/gi, '')
                             .replace(/i got/gi, '')
                             .replace(/dollars/gi, '')
                             .replace(/\d+/g, '')
                             .trim();

    if (!description) description = type === 'spent' ? 'Expense' : 'Income';

    if (amount > 0) {
      onResult({ description, amount, type });
    } else {
      setError('Could not detect an amount. Try saying "I spent 10 dollars"');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={startListening} 
        disabled={isListening}
        className="btn"
        style={{ 
          background: isListening ? 'var(--danger)' : 'var(--primary)', 
          color: 'white',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          padding: 0,
          boxShadow: isListening ? '0 0 20px var(--danger)' : '0 4px 12px rgba(99, 102, 241, 0.4)'
        }}
      >
        {isListening ? <Loader2 className="animate-spin" /> : <Mic size={24} />}
      </button>
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          right: 0, 
          background: 'var(--danger)', 
          color: 'white', 
          padding: '0.5rem 1rem', 
          borderRadius: '0.5rem', 
          fontSize: '0.75rem',
          marginTop: '0.5rem',
          whiteSpace: 'nowrap',
          zIndex: 10
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
