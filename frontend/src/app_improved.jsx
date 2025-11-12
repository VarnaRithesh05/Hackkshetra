import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Base URL for your Flask API
const API_URL = 'http://127.0.0.1:5000/api';

// === REUSABLE COMPONENTS ===

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Header = () => (
  <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center">
        <div className="flex items-center space-x-3">
          <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Akshara</h1>
            <p className="text-indigo-100 text-sm">60-Second AI Reading Fluency Diagnostic</p>
          </div>
        </div>
      </div>
    </div>
  </header>
);

const Timer = ({ seconds }) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div className="text-4xl font-mono font-bold text-indigo-600">
      {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
};

const MetricCard = ({ icon, label, value, color = "indigo" }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 border-${color}-500`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
      </div>
      <div className={`text-${color}-500`}>
        {icon}
      </div>
    </div>
  </div>
);

const Alert = ({ type = 'info', message, onClose }) => {
  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  return (
    <div className={`${colors[type]} border rounded-lg p-4 mb-4 flex items-start justify-between`}>
      <p className="flex-1">{message}</p>
      {onClose && (
        <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

// === MAIN APP COMPONENT ===

function App() {
  // State management
  const [passages, setPassages] = useState([]);
  const [selectedPassageId, setSelectedPassageId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('record');
  const [history, setHistory] = useState([]);
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
        setError("Could not load passages. Please ensure the backend server is running.");
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

  // Fetch history
  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/reports`);
      setHistory(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Could not load report history.");
    } finally {
      setIsLoading(false);
    }
  };

  // Recording functions
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Audio recording is not supported by this browser. Please use Chrome or Edge.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      setError("Could not start recording. Please ensure microphone permissions are granted.");
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

  // Analysis function
  const handleAnalyze = async () => {
    if (audioChunksRef.current.length === 0) {
      setError("No audio recorded. Please record the student reading first.");
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
        timeout: 120000, // 2 minute timeout for AI processing
      });
      setReport(response.data);
      audioChunksRef.current = [];
      setHasRecording(false);
      setRecordingTime(0);
    } catch (err) {
      console.error("Error analyzing audio:", err);
      const errorMsg = err.response?.data?.error || err.message || "Please check the backend server.";
      setError(`Analysis failed: ${errorMsg}`);
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

  // Get selected passage
  const selectedPassage = passages.find(p => p._id === selectedPassageId);

  // === RENDER ===

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setView('record')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                view === 'record'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>New Assessment</span>
              </span>
            </button>
            <button
              onClick={() => {
                setView('history');
                fetchHistory();
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                view === 'history'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Assessment History</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {view === 'record' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column: Recording Controls */}
            <div className="space-y-6">
              {/* Passage Selection */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Select Reading Level</h2>
                <select
                  value={selectedPassageId || ''}
                  onChange={(e) => setSelectedPassageId(e.target.value)}
                  disabled={isRecording || isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {passages.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.level} - {p.title || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recording Controls */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Record Student Reading</h2>
                
                {/* Timer Display */}
                <div className="flex justify-center items-center mb-6 p-6 bg-gray-50 rounded-lg">
                  <Timer seconds={recordingTime} />
                </div>

                {/* Control Buttons */}
                <div className="space-y-3">
                  {!isRecording && !hasRecording && (
                    <button
                      onClick={startRecording}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      <span>Start Recording</span>
                    </button>
                  )}

                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg animate-pulse"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                      </svg>
                      <span>Stop Recording</span>
                    </button>
                  )}

                  {hasRecording && !isRecording && (
                    <>
                      <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg"
                      >
                        {isLoading ? (
                          <>
                            <Spinner />
                            <span>Analyzing... (This may take 30-60 seconds)</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span>Analyze Reading</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetRecording}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Re-record</span>
                      </button>
                    </>
                  )}
                </div>

                {recordingTime >= 60 && isRecording && (
                  <Alert type="warning" message="60 seconds reached! Consider stopping the recording." />
                )}
              </div>
            </div>

            {/* Right Column: Passage Display & Results */}
            <div className="space-y-6">
              {/* Passage Display */}
              {selectedPassage && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedPassage.title || 'Reading Passage'}</h2>
                  <p className="text-sm text-indigo-600 font-medium mb-4">{selectedPassage.level}</p>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed text-lg">{selectedPassage.text}</p>
                  </div>
                </div>
              )}

              {/* Results Display */}
              {report && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">📊 Assessment Results</h2>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <MetricCard
                      icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                      label="Speed (WCPM)"
                      value={Math.round(report.wcpm)}
                      color="blue"
                    />
                    <MetricCard
                      icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      label="Accuracy"
                      value={`${Math.round(report.accuracy_percent)}%`}
                      color="green"
                    />
                    <MetricCard
                      icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
                      label="Prosody"
                      value={report.prosody_score}
                      color="purple"
                    />
                  </div>

                  {/* Additional Details */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold">{report.duration_seconds}s</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Correct Words:</span>
                        <span className="font-semibold">{report.correct_words} / {report.total_words}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Speaking Rate:</span>
                        <span className="font-semibold">{report.articulation_rate} words/sec</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Assessment Time:</span>
                        <span className="font-semibold">{new Date(report.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Word-by-Word Comparison */}
                  {report.diff_html && (
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Word-by-Word Analysis</h3>
                      <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: report.diff_html }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* History View */
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Assessment History</h2>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
                <span className="ml-3 text-gray-600">Loading history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">No assessments yet. Start by recording a student!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, idx) => (
                  <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                            #{history.length - idx}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <span className="text-xs text-gray-500">WCPM</span>
                            <p className="text-lg font-bold text-blue-600">{Math.round(item.wcpm)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Accuracy</span>
                            <p className="text-lg font-bold text-green-600">{Math.round(item.accuracy_percent)}%</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Prosody</span>
                            <p className="text-lg font-bold text-purple-600">{item.prosody_score}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-gray-600 text-sm">
            Akshara - Empowering teachers with AI-driven reading diagnostics
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
