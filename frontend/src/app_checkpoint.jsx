import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Timer = ({ seconds }) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div className="text-5xl font-black text-gray-900 font-mono">
      {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
};

const MetricCard = ({ icon, label, value, color }) => {
  return (
    <div className={`bg-white border-l-4 ${color} rounded-xl shadow-lg p-6 border-2 border-gray-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{label}</p>
          <p className="text-3xl font-black text-gray-900">{value}</p>
        </div>
        <div className="text-purple-500 ml-2">{icon}</div>
      </div>
    </div>
  );
};

function App() {
  const [passages, setPassages] = useState([]);
  const [selectedPassageId, setSelectedPassageId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Fetch passages on mount
  useEffect(() => {
    const fetchPassages = async () => {
      try {
        const response = await axios.get(`${API_URL}/passages`);
        setPassages(response.data);
        if (response.data.length > 0) {
          setSelectedPassageId(response.data[0]._id);
        }
      } catch (err) {
        console.error("Error fetching passages:", err);
        setError("Could not load passages. Check backend server.");
      }
    };
    fetchPassages();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setReport(null);
      setError(null);
      setHasRecording(false);
      
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Could not start recording. Check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setHasRecording(true);
    }
    setIsRecording(false);
  };

  const handleAnalyze = async () => {
    if (audioChunksRef.current.length === 0) {
      setError("No audio recorded.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setReport(null);

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const passage = passages.find(p => p._id === selectedPassageId);

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('passage', passage.text);
    formData.append('passage_id', passage._id);

    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setReport(response.data);
      audioChunksRef.current = [];
      setHasRecording(false);
      setRecordingTime(0);
    } catch (err) {
      console.error("Error analyzing audio:", err);
      setError(`Analysis failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetRecording = () => {
    audioChunksRef.current = [];
    setHasRecording(false);
    setRecordingTime(0);
    setReport(null);
    setError(null);
  };

  const selectedPassage = passages.find(p => p._id === selectedPassageId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center text-xl shadow-md">📖</div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Akshara</h1>
              <p className="text-gray-500 text-xs font-medium">Reading Fluency AI - 7 Hour Checkpoint</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {error && (
          <div className="bg-red-50 border-2 border-red-300 text-red-800 rounded-xl p-3 mb-4">
            ❌ {error}
          </div>
        )}

        {/* Passage Selector */}
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-xl mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📖</span>
            Choose Passage
          </h2>
          <select
            value={selectedPassageId || ''}
            onChange={(e) => setSelectedPassageId(e.target.value)}
            disabled={isRecording || isLoading || passages.length === 0}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-medium"
          >
            <option value="">Select a passage...</option>
            {passages.map((passage) => (
              <option key={passage._id} value={passage._id}>
                {passage.level} - {passage.title || 'Untitled'}
              </option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Reading Passage */}
          {selectedPassage && (
            <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{selectedPassage.title || 'Reading Passage'}</h2>
                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">{selectedPassage.level}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 max-h-96 overflow-y-auto">
                <p className="leading-relaxed text-base text-gray-800">{selectedPassage.text}</p>
              </div>
            </div>
          )}

          {/* Recording Controls */}
          <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🎙️</span>
              Recording
            </h2>
            
            <div className="flex justify-center items-center mb-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <Timer seconds={recordingTime} />
            </div>

            <div className="space-y-2">
              {!isRecording && !hasRecording && (
                <button
                  onClick={startRecording}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white disabled:bg-gray-400 font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                >
                  <span className="text-lg">▶️</span>
                  <span>START RECORDING</span>
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all animate-pulse shadow-lg"
                >
                  <span className="text-lg">⏹️</span>
                  <span>STOP</span>
                </button>
              )}

              {hasRecording && !isRecording && (
                <>
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white disabled:bg-gray-400 font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <Spinner />
                        <span className="text-xs">Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">✨</span>
                        <span>Analyze Reading</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetRecording}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-2 border-2 border-purple-200 hover:border-purple-300 text-purple-700 disabled:border-gray-200 font-semibold py-2.5 px-5 rounded-xl transition-all"
                  >
                    <span>🔄</span>
                    <span>Try Again</span>
                  </button>
                </>
              )}
            </div>

            {/* Analysis Progress Indicator */}
            {isLoading && (
              <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">🔄 AI Pipeline Running:</p>
                <ul className="text-xs text-blue-700 space-y-1 ml-4">
                  <li>• Converting audio with pydub</li>
                  <li>• Running Whisper ASR transcription</li>
                  <li>• Analyzing with difflib (word matching)</li>
                  <li>• Calculating WCPM & Accuracy</li>
                  <li>• Generating prosody score</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Results Display */}
        {report && (
          <div className="mt-6 space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 shadow-xl">
              <h2 className="text-3xl font-bold text-white flex items-center">
                <span className="text-4xl mr-3">🎉</span>
                AI Analysis Results
              </h2>
              <p className="text-purple-100 text-sm mt-2">
                Core pipeline analysis complete: Whisper ASR → difflib → WCPM calculation
              </p>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                label="Speed (WCPM)"
                value={Math.round(report.wcpm)}
                color="border-blue-500"
              />
              <MetricCard
                icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="Accuracy"
                value={`${Math.round(report.accuracy_percent)}%`}
                color="border-green-500"
              />
              <MetricCard
                icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="Prosody"
                value={report.prosody_score}
                color="border-purple-500"
              />
            </div>

            {/* Word Breakdown */}
            {report.diff_html && (
              <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  📝 Word-by-Word Analysis (difflib Output)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This is the raw data from Python's difflib library. We'll use this to build the Miscue Heatmap in the next phase.
                </p>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: report.diff_html }}
                />
              </div>
            )}

            {/* Raw Data - For Debugging/Mentor Demo */}
            <details className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
              <summary className="font-bold text-gray-700 cursor-pointer hover:text-purple-600">
                🔍 Raw Analysis Data (for mentor review)
              </summary>
              <pre className="mt-2 text-xs bg-gray-200 p-4 rounded overflow-x-auto max-h-96">
                {JSON.stringify(report, null, 2)}
              </pre>
            </details>

            {/* Next Steps Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
                <span className="text-2xl mr-2">✅</span>
                Checkpoint Complete! Next Steps:
              </h3>
              <ul className="text-sm text-green-700 space-y-2 ml-6">
                <li>• Build Student Management System (Excel upload, searchable dropdown)</li>
                <li>• Create History Dashboard (track WCPM & Accuracy over time)</li>
                <li>• Implement Reading Archetypes ("The Careful Decoder", etc.)</li>
                <li>• Add Miscue Heatmap visualization</li>
                <li>• Polish UI with dark mode and advanced features</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
