import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const WordTooltip = ({ word, wordData, position }) => {
  if (!position) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'correct': return '✓';
      case 'incorrect': return '✗';
      case 'approximate': return '⚠';
      case 'skipped': return '−';
      default: return '?';
    }
  };

  return (
    <div 
      className="fixed z-50 bg-white rounded-xl shadow-2xl border-2 border-purple-300 p-4 pointer-events-none"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'translateX(-50%) translateY(-100%)',
        minWidth: '250px',
        maxWidth: '300px',
        marginTop: '-10px'
      }}
    >
      {/* Arrow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-purple-300"></div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-purple-700">{word}</h3>
          <span className={`text-2xl ${
            wordData.status === 'correct' ? 'text-green-600' :
            wordData.status === 'incorrect' ? 'text-red-600' :
            wordData.status === 'approximate' ? 'text-yellow-600' :
            'text-gray-600'
          }`}>
            {getStatusIcon(wordData.status)}
          </span>
        </div>

        {wordData.student_word && wordData.student_word !== word && (
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <p className="text-xs text-blue-700 font-bold">You said:</p>
            <p className="text-sm font-black text-blue-900">{wordData.student_word}</p>
          </div>
        )}

        {wordData.status === 'skipped' && (
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
            <p className="text-xs text-gray-700 font-bold">This word was skipped</p>
          </div>
        )}

        {wordData.confidence !== null && wordData.confidence !== undefined && (
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs font-bold text-gray-700 mb-1">Confidence</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    wordData.confidence > 80 ? 'bg-green-500' :
                    wordData.confidence > 50 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${wordData.confidence}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-gray-700">{wordData.confidence}%</span>
            </div>
          </div>
        )}

        <div className="text-xs text-purple-600 font-semibold text-center pt-1 border-t border-purple-100">
          🔊 Click to hear pronunciation
        </div>
      </div>
    </div>
  );
};

const InteractiveWordPlayback = ({ wordAnalysis, passageText, audioPath, opcodes, asrWords }) => {
  const [hoveredWord, setHoveredWord] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [playingWord, setPlayingWord] = useState(null);
  
  // Extract inserted words from opcodes
  const insertedWords = [];
  if (opcodes && asrWords) {
    opcodes.forEach(([tag, i1, i2, j1, j2]) => {
      if (tag === 'insert') {
        insertedWords.push(...asrWords.slice(j1, j2));
      }
    });
  }

  const playPronunciation = async (word) => {
    try {
      setPlayingWord(word);
      // Remove punctuation from word before sending to API
      const cleanWord = word.replace(/[.,!?;:'"()-]/g, '').trim();
      
      if (!cleanWord) {
        console.error('No valid word to pronounce after cleaning');
        setPlayingWord(null);
        return;
      }
      
      console.log(`🔊 Requesting pronunciation for: "${cleanWord}"`);
      
      const response = await axios.get(`${API_URL}/word/pronounce/${encodeURIComponent(cleanWord)}`, {
        responseType: 'blob',
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✓ Received audio response');
      
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        console.log('✓ Audio finished playing');
        URL.revokeObjectURL(audioUrl); // Clean up
        setPlayingWord(null);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        URL.revokeObjectURL(audioUrl); // Clean up
        setPlayingWord(null);
      };
      
      await audio.play();
      console.log('▶️ Playing audio...');
    } catch (err) {
      console.error('Error playing pronunciation:', err);
      if (err.response) {
        console.error('Response error:', err.response.data);
        console.error('Status:', err.response.status);
      }
      alert(`Could not play pronunciation: ${err.message}`);
      setPlayingWord(null);
    }
  };

  const handleMouseEnter = (wordData, event) => {
    const rect = event.target.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setHoveredWord(wordData);
  };

  const handleMouseLeave = () => {
    setHoveredWord(null);
    setTooltipPosition(null);
  };

  const handleWordClick = (word, event) => {
    event.preventDefault();
    playPronunciation(word);
  };

  const getWordColor = (status, isPlaying) => {
    if (isPlaying) {
      return 'bg-purple-300 border-purple-500 text-purple-900 animate-pulse';
    }
    
    switch (status) {
      case 'correct':
        return 'bg-green-200 hover:bg-green-300 border-green-400 text-green-900';
      case 'incorrect':
        return 'bg-red-200 hover:bg-red-300 border-red-400 text-red-900';
      case 'approximate':
        return 'bg-yellow-200 hover:bg-yellow-300 border-yellow-400 text-yellow-900';
      case 'skipped':
        return 'bg-gray-200 hover:bg-gray-300 border-gray-400 text-gray-900';
      default:
        return 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700';
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
      <h2 className="text-2xl font-black text-purple-700 mb-4 flex items-center">
        <span className="text-3xl mr-2">✨</span>
        Interactive Word Playback
      </h2>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs font-bold">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-green-200 border-2 border-green-400"></div>
          <span>Correct</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-red-200 border-2 border-red-400"></div>
          <span>Incorrect</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-yellow-200 border-2 border-yellow-400"></div>
          <span>Approximate</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-gray-200 border-2 border-gray-400"></div>
          <span>Skipped</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-blue-200 border-2 border-blue-400"></div>
          <span>Inserted (Extra)</span>
        </div>
      </div>

      <p className="text-sm text-purple-600 mb-4 font-semibold">
        💡 Hover to see details • Click to hear pronunciation
      </p>

      {/* Interactive Words */}
      <div className="bg-white rounded-xl p-4 leading-relaxed text-lg relative">
        {wordAnalysis && wordAnalysis.map((wordData, index) => (
          <React.Fragment key={index}>
            <span
              onMouseEnter={(e) => handleMouseEnter(wordData, e)}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => handleWordClick(wordData.word, e)}
              className={`inline-block m-1 px-2 py-1 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-110 font-semibold ${getWordColor(wordData.status, playingWord === wordData.word)}`}
              title={`${wordData.status} - Click to hear pronunciation`}
            >
              {wordData.word}
            </span>
            {' '}
          </React.Fragment>
        ))}
      </div>

      {/* Tooltip */}
      {hoveredWord && tooltipPosition && (
        <WordTooltip 
          word={hoveredWord.word} 
          wordData={hoveredWord} 
          position={tooltipPosition}
        />
      )}

      {/* Inserted Words Section */}
      {insertedWords.length > 0 && (
        <div className="mt-6 pt-4 border-t-2 border-purple-300">
          <h3 className="text-lg font-bold text-blue-700 mb-3 flex items-center">
            <span className="text-xl mr-2">🔵</span>
            Extra Words (Not in passage)
          </h3>
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <p className="text-sm text-blue-800 mb-3 font-semibold">
              These words were said by the student but weren't in the original passage:
            </p>
            <div className="flex flex-wrap gap-2">
              {insertedWords.map((word, index) => (
                <span
                  key={index}
                  onClick={(e) => handleWordClick(word, e)}
                  className="inline-block px-3 py-2 bg-blue-200 hover:bg-blue-300 border-2 border-blue-400 text-blue-900 rounded-lg cursor-pointer font-semibold text-base transition-all transform hover:scale-105"
                  title="Click to hear pronunciation"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveWordPlayback;
