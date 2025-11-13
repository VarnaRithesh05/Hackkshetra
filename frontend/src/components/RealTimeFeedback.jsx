import React, { useEffect, useRef, useState } from 'react';

const RealTimeFeedback = ({ isRecording, stream, darkMode }) => {
  const [volume, setVolume] = useState(0);
  const [pace, setPace] = useState('normal');
  const [noiseDetected, setNoiseDetected] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const lastWordTimeRef = useRef(Date.now());
  const wordsPerMinuteRef = useRef(0);

  useEffect(() => {
    if (!isRecording || !stream) {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      setVolume(0);
      setPace('normal');
      setNoiseDetected(false);
      return;
    }

    // Setup audio analysis
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const analyze = () => {
      if (!isRecording) return;

      analyser.getByteFrequencyData(dataArray);
      
      // Calculate volume (0-100) with enhanced sensitivity
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      // Amplify the signal for better visibility (multiply by 2 and clamp)
      const volumePercent = Math.min(100, (average / 128) * 200);
      setVolume(volumePercent);

      // Detect background noise (high frequency analysis)
      const highFreqData = dataArray.slice(dataArray.length / 2);
      const highFreqAvg = highFreqData.reduce((a, b) => a + b) / highFreqData.length;
      setNoiseDetected(highFreqAvg > 30 && average < 20);

      // Estimate pace (simplified - based on volume changes)
      // In production, you'd use actual speech recognition
      if (volumePercent > 15) {
        const now = Date.now();
        const timeSinceLastWord = now - lastWordTimeRef.current;
        
        if (timeSinceLastWord > 2000) {
          setPace('slow');
          wordsPerMinuteRef.current = Math.max(0, wordsPerMinuteRef.current - 10);
        } else if (timeSinceLastWord < 200) {
          setPace('fast');
          wordsPerMinuteRef.current = Math.min(200, wordsPerMinuteRef.current + 10);
        } else {
          setPace('normal');
        }
        
        lastWordTimeRef.current = now;
      }

      animationRef.current = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, stream]);

  if (!isRecording) return null;

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} rounded-xl border-2 p-4 space-y-3 transition-colors`}>
      <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
        <span className="text-lg">📊</span>
        Real-time Feedback
      </h3>

      {/* Volume Indicator */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            🎤 Volume Level
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${volume > 50 ? 'animate-pulse' : ''}`}>
              {volume > 70 ? '🔊' : volume > 40 ? '🔉' : volume > 10 ? '🔈' : '🔇'}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              volume > 50 ? 'bg-green-500 text-white' : 
              volume > 20 ? 'bg-yellow-500 text-white' : 
              'bg-red-500 text-white'
            }`}>
              {Math.round(volume)}%
            </span>
          </div>
        </div>
        <div className={`w-full h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden shadow-inner`}>
          <div 
            className={`h-full transition-all duration-75 ease-out ${
              volume > 50 ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-lg shadow-green-500/50' : 
              volume > 20 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50' : 
              'bg-gradient-to-r from-red-400 to-red-600 shadow-lg shadow-red-500/50'
            } ${volume > 50 ? 'animate-pulse' : ''}`}
            style={{ width: `${volume}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs">
          <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Silent</span>
          <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Optimal</span>
        </div>
      </div>

      {/* Pace Indicator */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          ⏱️ Reading Pace
        </span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
          pace === 'fast' ? 'bg-orange-100 text-orange-700' :
          pace === 'slow' ? 'bg-blue-100 text-blue-700' :
          'bg-green-100 text-green-700'
        }`}>
          {pace === 'fast' ? '🐇 Too Fast' : pace === 'slow' ? '🐢 Too Slow' : '✓ Just Right'}
        </span>
      </div>

      {/* Noise Alert */}
      {noiseDetected && (
        <div className="flex items-center gap-2 p-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg animate-pulse">
          <span className="text-lg">⚠️</span>
          <span className="text-xs font-bold text-yellow-800">
            Background noise detected
          </span>
        </div>
      )}

      {/* Visual Waveform */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
        <div className="flex items-center justify-center gap-1 h-16">
          {[...Array(25)].map((_, i) => {
            const randomMultiplier = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
            const barHeight = Math.max(4, (volume / 100) * 64 * randomMultiplier);
            return (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  volume > 50 ? 'bg-gradient-to-t from-green-600 to-green-400 shadow-lg shadow-green-500/30' : 
                  volume > 20 ? 'bg-gradient-to-t from-yellow-600 to-yellow-400 shadow-lg shadow-yellow-500/30' : 
                  volume > 5 ? 'bg-gradient-to-t from-blue-600 to-blue-400' :
                  'bg-gray-400'
                }`}
                style={{
                  height: `${barHeight}px`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RealTimeFeedback;
