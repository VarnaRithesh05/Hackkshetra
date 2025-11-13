import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const WordDetailModal = ({ word, wordData, onClose, audioPath }) => {
  const [loading, setLoading] = useState(false);
  const [wordImage, setWordImage] = useState(null);
  const [studentAudio, setStudentAudio] = useState(null);

  React.useEffect(() => {
    // Fetch word image
    const fetchWordImage = async () => {
      try {
        const response = await axios.get(`${API_URL}/word/image/${word}`);
        setWordImage(response.data);
      } catch (err) {
        console.error('Error fetching word image:', err);
      }
    };
    fetchWordImage();
  }, [word]);

  const playCorrectPronunciation = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/word/pronounce/${word}`, {
        responseType: 'blob'
      });
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error('Error playing pronunciation:', err);
    } finally {
      setLoading(false);
    }
  };

  const playStudentAudio = async () => {
    if (!wordData.student_start || !wordData.student_end || !audioPath) {
      alert('Student audio not available for this word');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/word/extract-audio`, {
        audio_path: audioPath,
        start_time: wordData.student_start,
        end_time: wordData.student_end
      });
      
      const audio = new Audio(response.data.audio);
      audio.play();
      setStudentAudio(response.data.audio);
    } catch (err) {
      console.error('Error playing student audio:', err);
      alert('Could not play student audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-black text-purple-700">{word}</h2>
            <p className="text-sm text-gray-600">
              Status: <span className={`font-bold ${
                wordData.status === 'correct' ? 'text-green-600' :
                wordData.status === 'incorrect' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {wordData.status.charAt(0).toUpperCase() + wordData.status.slice(1)}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-bold">×</button>
        </div>

        {/* Word Visual */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-4 text-center">
          {wordImage && (
            <div className="text-8xl mb-2">{wordImage.emoji}</div>
          )}
          <p className="text-gray-700 font-medium">{wordImage?.definition || 'Loading...'}</p>
        </div>

        {/* Pronunciation Buttons */}
        <div className="space-y-3 mb-4">
          <button
            onClick={playCorrectPronunciation}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            <span className="text-xl">🎧</span>
            <span>Play Correct Pronunciation</span>
          </button>

          {wordData.student_start !== null && wordData.student_end !== null && (
            <button
              onClick={playStudentAudio}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              <span className="text-xl">🔁</span>
              <span>Play My Voice</span>
            </button>
          )}
        </div>

        {/* Student Word Info */}
        {wordData.student_word && (
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-blue-900 mb-1">You said:</p>
            <p className="text-lg font-black text-blue-700">{wordData.student_word}</p>
            {wordData.student_start !== null && (
              <p className="text-xs text-blue-600 mt-1">
                At {wordData.student_start.toFixed(2)}s - {wordData.student_end.toFixed(2)}s
              </p>
            )}
          </div>
        )}

        {/* Confidence Score */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-bold text-gray-700 mb-2">Confidence Score</p>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  wordData.confidence > 80 ? 'bg-green-500' :
                  wordData.confidence > 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${wordData.confidence}%` }}
              ></div>
            </div>
            <span className="font-bold text-gray-700">{wordData.confidence}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const InteractiveWordPlayback = ({ wordAnalysis, passageText, audioPath }) => {
  const [selectedWord, setSelectedWord] = useState(null);

  const getWordColor = (status) => {
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
      </div>

      <p className="text-sm text-purple-600 mb-4 font-semibold">
        💡 Click any word to hear pronunciation, see pictures, and compare with your reading!
      </p>

      {/* Interactive Words */}
      <div className="bg-white rounded-xl p-4 leading-relaxed text-lg">
        {wordAnalysis && wordAnalysis.map((wordData, index) => (
          <React.Fragment key={index}>
            <span
              onClick={() => setSelectedWord({ word: wordData.word, data: wordData })}
              className={`inline-block m-1 px-2 py-1 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-110 font-semibold ${getWordColor(wordData.status)}`}
              title={`Click to learn more about "${wordData.word}"`}
            >
              {wordData.word}
            </span>
            {' '}
          </React.Fragment>
        ))}
      </div>

      {/* Modal */}
      {selectedWord && (
        <WordDetailModal
          word={selectedWord.word}
          wordData={selectedWord.data}
          audioPath={audioPath}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
};

export default InteractiveWordPlayback;
