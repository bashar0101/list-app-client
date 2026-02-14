import React, { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';

const VoiceInput = ({ onResult, lang = 'en-US' }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [reviewData, setReviewData] = useState(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    setReviewData(null);
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
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
      setError('Error: ' + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processText = (text) => {
    // Handle Eastern Arabic Numerals (٠١٢٣٤٥٦٧٨٩)
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let cleanedText = text;
    for (let i = 0; i < 10; i++) {
      cleanedText = cleanedText.replace(arabicDigits[i], i);
    }

    const lowercaseText = cleanedText.toLowerCase();
    
    // Find all numbers in the text (handling commas like 1,000)
    const numbers = lowercaseText.match(/(\d+(?:,\d+)*)/g);
    let amount = 0;
    
    if (numbers && numbers.length > 0) {
      // If there's a number after "for" or "to" or similar markers
      const forMatch = lowercaseText.match(/(?:for|to|cost|amount|اشتريت|بمبلغ|سعر)\s+(\d+(?:,\d+)*)/);
      if (forMatch) {
        amount = parseInt(forMatch[1].replace(/,/g, ''));
      } else {
        // Fallback: pick the largest number found
        const parsedNumbers = numbers.map(n => parseInt(n.replace(/,/g, '')));
        amount = Math.max(...parsedNumbers);
      }
    }

    let description = cleanedText;
    const noiseWords = [
      'i spent', 'i got', 'i received', 'i earned', 'i gained', 'i had',
      'dollars', 'dollar', 'euros', 'euro', 'pounds', 'pound', 
      'riyals', 'riyal', 'dinar', 'dinars', 'bucks', 'cash',
      'on', 'from', 'a', 'an', 'the', 'for', 'at', 'with', 'and', 'my'
    ];
    
    // Only apply English noise words if we detect English-like start
    if (lang.startsWith('en')) {
      noiseWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        description = description.replace(regex, '');
      });
    }
    
    description = description.replace(/\d+(?:,\d+)*/g, '').replace(/\s+/g, ' ').trim();
    if (description) {
      description = description.charAt(0).toUpperCase() + description.slice(1);
    } else {
      description = 'Transaction';
    }

    if (amount > 0) {
      setReviewData({ description, amount });
    } else {
      setError('Could not detect an amount. Try "10 dollars for coffee"');
    }
  };

  const handleConfirm = (type) => {
    onResult({ ...reviewData, type });
    setReviewData(null);
  };

  const handleReviewChange = (field, value) => {
    setReviewData({ ...reviewData, [field]: value });
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {reviewData ? (
        <div className="glass-card voice-review-card animate-fade-in">
          <h4 style={{ marginBottom: '1rem' }}>Confirm & Edit</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--glass)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Description</div>
              <input 
                value={reviewData.description}
                onChange={(e) => handleReviewChange('description', e.target.value)}
                style={{ 
                  width: '100%', 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white', 
                  fontWeight: '500',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ background: 'var(--glass)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Amount</div>
              <input 
                type="number"
                value={reviewData.amount}
                onChange={(e) => handleReviewChange('amount', parseInt(e.target.value) || 0)}
                style={{ 
                  width: '100%', 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white', 
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => handleConfirm('got')} 
              className="btn btn-primary" 
              style={{ flex: 1, background: 'var(--success)', padding: '0.6rem', fontSize: '0.9rem' }}
            >
              Gain
            </button>
            <button 
              onClick={() => handleConfirm('spent')} 
              className="btn btn-primary" 
              style={{ flex: 1, background: 'var(--danger)', padding: '0.6rem', fontSize: '0.9rem' }}
            >
              Spent
            </button>
          </div>
          <button 
            onClick={() => setReviewData(null)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.75rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      ) : (
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
      )}

      {error && !reviewData && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          right: 0, 
          background: 'var(--danger)', 
          color: 'white', 
          padding: '0.4rem 0.8rem', 
          borderRadius: '0.5rem', 
          fontSize: '0.7rem',
          marginTop: '0.5rem',
          zIndex: 10
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
