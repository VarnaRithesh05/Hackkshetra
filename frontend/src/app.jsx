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
  <header className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-xl">
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white rounded-full p-2 shadow-lg">
            <svg className="h-8 w-8 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">✨ Akshara</h1>
            <p className="text-pink-100 text-xs font-medium">60-Second Reading Fun! 📚</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2">
          <span className="text-white text-sm font-bold bg-white/20 px-3 py-1 rounded-full">AI-Powered</span>
        </div>
      </div>
    </div>
  </header>
);

const Timer = ({ seconds }) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 font-mono">
      {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
};

const MetricCard = ({ icon, label, value, gradient }) => {
  const gradients = {
    blue: 'from-blue-400 to-cyan-400',
    green: 'from-green-400 to-emerald-400',
    purple: 'from-purple-400 to-pink-400'
  };
  
  return (
    <div className={`bg-gradient-to-br ${gradients[gradient]} rounded-2xl shadow-lg p-4 transform hover:scale-105 transition-transform`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold text-white/80 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-3xl font-black text-white">{value}</p>
        </div>
        <div className="text-white/90 ml-2">
          {icon}
        </div>
      </div>
    </div>
  );
};

const Alert = ({ type = 'info', message, onClose }) => {
  const colors = {
    error: 'bg-gradient-to-r from-red-100 to-pink-100 border-red-400 text-red-800',
    success: 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400 text-green-800',
    info: 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-400 text-blue-800',
    warning: 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400 text-yellow-800'
  };
  
  const icons = {
    error: '❌',
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️'
  };

  return (
    <div className={`${colors[type]} border-2 rounded-xl p-3 mb-3 flex items-start justify-between shadow-lg`}>
      <div className="flex items-center space-x-2">
        <span className="text-xl">{icons[type]}</span>
        <p className="flex-1 font-bold text-sm">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="ml-3 text-gray-600 hover:text-gray-800 font-bold">
          ✕
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
  
  // Student information state
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentId, setStudentId] = useState('');

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
    
    // Validate student information
    if (!studentName.trim()) {
      setError("Please enter the student's name before analyzing.");
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
    
    // Add student information
    formData.append('student_name', studentName.trim());
    formData.append('student_grade', studentGrade.trim());
    formData.append('student_id', studentId.trim());

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
    // Don't clear student info - teacher might assess same student multiple times
  };
  
  const clearStudentInfo = () => {
    setStudentName('');
    setStudentGrade('');
    setStudentId('');
    resetRecording();
  };

  // Get selected passage
  const selectedPassage = passages.find(p => p._id === selectedPassageId);

  // === RENDER ===

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <Header />

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm shadow-md border-b-4 border-pink-300">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setView('record')}
              className={`py-3 px-4 border-b-4 font-bold text-sm transition-all transform ${
                view === 'record'
                  ? 'border-pink-500 text-pink-600 scale-105'
                  : 'border-transparent text-gray-500 hover:text-pink-500 hover:border-pink-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-xl">🎤</span>
                <span>Record Reading</span>
              </span>
            </button>
            <button
              onClick={() => {
                setView('history');
                fetchHistory();
              }}
              className={`py-3 px-4 border-b-4 font-bold text-sm transition-all transform ${
                view === 'history'
                  ? 'border-purple-500 text-purple-600 scale-105'
                  : 'border-transparent text-gray-500 hover:text-purple-500 hover:border-purple-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-xl">📊</span>
                <span>All Scores</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {view === 'record' ? (
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Left Column: Recording Controls */}
            <div className="space-y-4">
              {/* Student Information Form */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-black text-blue-700 flex items-center">
                    <span className="text-2xl mr-2">👦</span>
                    Student Info
                  </h2>
                  {(studentName || studentGrade || studentId) && (
                    <button
                      onClick={clearStudentInfo}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded-full"
                      disabled={isRecording || isLoading}
                    >
                      New Student
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      disabled={isRecording || isLoading}
                      placeholder="Student's name"
                      className="w-full px-3 py-2 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-blue-900 mb-1">
                        Grade
                      </label>
                      <input
                        type="text"
                        value={studentGrade}
                        onChange={(e) => setStudentGrade(e.target.value)}
                        disabled={isRecording || isLoading}
                        placeholder="Grade 2"
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-900 mb-1">
                        ID
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        disabled={isRecording || isLoading}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Passage Selection */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-4 border-2 border-purple-200">
                <h2 className="text-lg font-black text-purple-700 mb-3 flex items-center">
                  <span className="text-2xl mr-2">📖</span>
                  Choose Story
                </h2>
                <select
                  value={selectedPassageId || ''}
                  onChange={(e) => setSelectedPassageId(e.target.value)}
                  disabled={isRecording || isLoading}
                  className="w-full px-3 py-2 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-bold text-sm text-purple-900 bg-white"
                >
                  {passages.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.level} - {p.title || 'Untitled'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recording Controls */}
              <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl shadow-lg p-4 border-2 border-pink-200">
                <h2 className="text-lg font-black text-pink-700 mb-3 flex items-center">
                  <span className="text-2xl mr-2">🎙️</span>
                  Recording
                </h2>
                
                {/* Timer Display */}
                <div className="flex justify-center items-center mb-4 p-4 bg-white rounded-2xl shadow-inner border-2 border-pink-200">
                  <Timer seconds={recordingTime} />
                </div>

                {/* Control Buttons */}
                <div className="space-y-2">
                  {!isRecording && !hasRecording && (
                    <button
                      onClick={startRecording}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-black py-3 px-6 rounded-xl transition-all shadow-xl transform hover:scale-105 text-lg"
                    >
                      <span className="text-2xl">▶️</span>
                      <span>START!</span>
                    </button>
                  )}

                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-black py-3 px-6 rounded-xl transition-all shadow-xl animate-pulse text-lg"
                    >
                      <span className="text-2xl">⏹️</span>
                      <span>STOP</span>
                    </button>
                  )}

                  {hasRecording && !isRecording && (
                    <>
                      <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-green-300 disabled:to-emerald-300 text-white font-black py-3 px-6 rounded-xl transition-all shadow-xl transform hover:scale-105 text-lg"
                      >
                        {isLoading ? (
                          <>
                            <Spinner />
                            <span className="text-sm">Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">✨</span>
                            <span>Check Score!</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetRecording}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-gray-100 disabled:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded-xl transition-colors border-2 border-gray-300 text-sm"
                      >
                        <span>🔄</span>
                        <span>Try Again</span>
                      </button>
                    </>
                  )}
                </div>

                {recordingTime >= 60 && isRecording && (
                  <div className="mt-3 p-2 bg-yellow-100 border-2 border-yellow-400 rounded-xl text-center">
                    <p className="text-sm font-bold text-yellow-800">⏰ Time's up! Stop recording.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Passage Display & Results */}
            <div className="space-y-4">
              {/* Passage Display */}
              {selectedPassage && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-4 border-2 border-yellow-300">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-black text-orange-700">{selectedPassage.title || 'Reading Passage'}</h2>
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">{selectedPassage.level}</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-inner border-2 border-yellow-200">
                    <p className="text-gray-800 leading-relaxed text-base font-medium">{selectedPassage.text}</p>
                  </div>
                </div>
              )}

              {/* Results Display */}
              {report && (
                <div className="space-y-3">
                  <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex items-center">
                    <span className="text-3xl mr-2">🎉</span>
                    Great Job!
                  </h2>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                      label="Speed"
                      value={Math.round(report.wcpm)}
                      gradient="blue"
                    />
                    <MetricCard
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      label="Accuracy"
                      value={`${Math.round(report.accuracy_percent)}%`}
                      gradient="green"
                    />
                    <MetricCard
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      label="Expression"
                      value={report.prosody_score}
                      gradient="purple"
                    />
                  </div>

                  {/* Additional Details */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-purple-200">
                    <h3 className="text-sm font-black text-purple-700 mb-3">📝 Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-purple-50 p-2 rounded-lg">
                        <span className="text-gray-600 block">Duration</span>
                        <span className="font-bold text-purple-700 text-lg">{report.duration_seconds}s</span>
                      </div>
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <span className="text-gray-600 block">Correct Words</span>
                        <span className="font-bold text-blue-700 text-lg">{report.correct_words}/{report.total_words}</span>
                      </div>
                    </div>
                  </div>

                  {/* Word-by-Word Comparison */}
                  {report.diff_html && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-4 border-2 border-indigo-300">
                      <h3 className="text-base font-black text-indigo-700 mb-3 flex items-center">
                        <span className="text-2xl mr-2">🔍</span>
                        Word-by-Word Check
                      </h3>
                      <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: report.diff_html }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* History View */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 border-2 border-purple-200">
            <h2 className="text-2xl font-black text-purple-700 mb-4 flex items-center">
              <span className="text-3xl mr-2">📚</span>
              All Scores
            </h2>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner />
                <span className="ml-3 text-gray-600 font-bold">Loading...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-3">📝</div>
                <p className="font-bold">No scores yet!</p>
                <p className="text-sm">Record a student to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={item._id} className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-xl p-3 hover:shadow-lg transition-all transform hover:scale-[1.02]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        #{history.length - idx}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Student Information */}
                    {item.student_name && (
                      <div className="mb-2 p-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg border-2 border-blue-300">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">👦</span>
                          <div className="flex-1">
                            <span className="font-black text-blue-900 text-sm">{item.student_name}</span>
                            {item.student_grade && <span className="text-blue-700 ml-2 text-xs font-bold">• {item.student_grade}</span>}
                            {item.student_id && <span className="text-blue-600 text-xs ml-2">(ID: {item.student_id})</span>}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gradient-to-br from-blue-400 to-cyan-400 p-2 rounded-lg text-center">
                        <span className="text-xs text-white/80 font-bold block">Speed</span>
                        <p className="text-xl font-black text-white">{Math.round(item.wcpm)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-400 to-emerald-400 p-2 rounded-lg text-center">
                        <span className="text-xs text-white/80 font-bold block">Accuracy</span>
                        <p className="text-xl font-black text-white">{Math.round(item.accuracy_percent)}%</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-400 to-pink-400 p-2 rounded-lg text-center">
                        <span className="text-xs text-white/80 font-bold block">Expression</span>
                        <p className="text-xl font-black text-white">{item.prosody_score}</p>
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
      <footer className="bg-gradient-to-r from-purple-500 to-pink-500 mt-8 border-t-4 border-yellow-400">
        <div className="container mx-auto px-4 py-3">
          <p className="text-center text-white text-xs font-bold">
            ✨ Akshara - Making Reading Fun with AI Magic! 🎉
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
