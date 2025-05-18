import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const keyToDot = { d: 1, w: 2, q: 3, k: 4, o: 5, p: 6 };
const dotPatterns = {
  "1": "A", "12": "B", "14": "C", "145": "D", "15": "E",
  "124": "F", "1245": "G", "125": "H", "24": "I", "245": "J",
  "13": "K", "123": "L", "134": "M", "1345": "N", "135": "O",
  "1234": "P", "12345": "Q", "1235": "R", "234": "S", "2345": "T",
  "136": "U", "1236": "V", "2456": "W", "1346": "X", "13456": "Y", "1356": "Z"
};

function App() {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [currentWord, setCurrentWord] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [dotsSequence, setDotsSequence] = useState([]);
  const inputRef = useRef(null);

  const updateSuggestions = (word) => {
   axios.post(`${process.env.REACT_APP_API_URL}/suggest`, { input: word })
    .then(res => setSuggestions(res.data.suggestions));
  };


  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();

      if (key === 'backspace') {
        setCurrentWord(prev => {
          const newWord = prev.slice(0, -1);
          updateSuggestions(newWord);
          return newWord;
        });
        setDotsSequence(prev => prev.slice(0, -1));
        return;
      }

      if (keyToDot[key]) {
        setPressedKeys(prev => new Set(prev).add(key));
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();

      if (pressedKeys.size > 0) {
        const dotNumbers = Array.from(pressedKeys)
          .map(k => keyToDot[k])
          .filter(Boolean)
          .sort()
          .join('');
        const char = dotPatterns[dotNumbers]?.toLowerCase();
        if (char) {
          setCurrentWord(prev => {
            const updated = prev + char;
            updateSuggestions(updated);
            return updated;
          });
          setDotsSequence(prev => [...prev, dotNumbers]);
        }
        setPressedKeys(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pressedKeys]);

  const renderBraille = (dotString) => {
    const activeDots = new Set(dotString.split('').map(Number));
    return (
      <div className="braille-cell">
        {[1, 4, 2, 5, 3, 6].map(dot => (
          <div key={dot} className={`dot dot-${dot} ${activeDots.has(dot) ? 'active' : ''}`}></div>
        ))}
      </div>
    );
  };

  return (
    <div className="container" onClick={() => inputRef.current?.focus()}>
      <h1>Braille Autocorrect</h1>
      <p>Click below and press D, W, Q, K, O, P for Braille dots. Release to register character.</p>

      <input
        ref={inputRef}
        className="focus-input"
        placeholder="Focus here and type..."
        onKeyDown={(e) => e.preventDefault()} // prevents actual text
      />

      <div className="word-display">
        <h3>Word: {currentWord}</h3>
        <button className='clear-btn' onClick={() => {
          setCurrentWord('');
          setDotsSequence([]);
          setSuggestions([]);
        }}>Clear</button>
      </div>

      <div className="braille-row">
        {dotsSequence.map((dotStr, i) => <div key={i}>{renderBraille(dotStr)}</div>)}
      </div>

      <h3>Suggestions:</h3>
      <ul>
        {suggestions.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}

export default App;
