import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';
import LandingPage from './components/LandingPage';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import InteractiveWordPlayback from './components/InteractiveWordPlayback';
import StudentUpload from './components/StudentUpload';

// Base URL for your Flask API
const API_URL = 'http://127.0.0.1:5000/api';

// Dark mode context
const DarkModeContext = React.createContext();
export const useDarkMode = () => React.useContext(DarkModeContext);

// === REUSABLE COMPONENTS ===

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Header = ({ onLoginClick, onLogout, currentUser, onViewProfile, darkMode, toggleDarkMode }) => {
  // Local state for small profile dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setShowDropdown(false);
      // basic keyboard: Enter/Space on button toggles handled by button element
    }
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [showDropdown]);

  useEffect(() => {
    // Focus first action when dropdown opens
    if (showDropdown && dropdownRef.current) {
      const first = dropdownRef.current.querySelector('button');
      first && first.focus();
    }
  }, [showDropdown]);

  return (
    <header className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm transition-colors`}>
      <div className="container mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-xl shadow-sm">📚</div>
            <div>
              <h1 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>Akshara</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs font-medium`}>Reading Fluency AI</p>
            </div>
          </div>

          {/* Right side: either auth buttons or profile */}
          <div className="hidden sm:flex items-center space-x-3 relative">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            
            {!currentUser ? (
              <>
                <button
                  onClick={onLoginClick}
                  className={`px-6 py-2 border-2 ${darkMode ? 'border-white text-white hover:bg-white hover:text-gray-900' : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'} rounded-full font-semibold transition-all text-sm`}
                >
                  Teacher Login
                </button>
              </>
            ) : (
              <>
                <button
                  ref={btnRef}
                  aria-haspopup="true"
                  aria-expanded={showDropdown}
                  onClick={() => setShowDropdown(!showDropdown)}
                  onKeyDown={(e) => { if (e.key === 'ArrowDown') setShowDropdown(true); }}
                  className={`flex items-center space-x-2 border ${darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'} px-3 py-2 rounded-full transition-all`}
                >
                  <span className={`w-7 h-7 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} flex items-center justify-center text-sm font-semibold`}>{(currentUser.name || currentUser.email || 'T').charAt(0).toUpperCase()}</span>
                  <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentUser.name ? currentUser.name.split(' ')[0] : (currentUser.email ? currentUser.email.split('@')[0] : 'Teacher')}</span>
                </button>

                {showDropdown && (
                  <div ref={dropdownRef} role="menu" aria-label="Profile menu" className={`absolute right-0 mt-12 w-44 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} rounded-xl shadow-lg border p-2 z-50`}>
                    <button onClick={() => { onViewProfile && onViewProfile(); setShowDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg transition font-medium ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50'}`}>View Profile</button>
                    <button onClick={() => { onLogout && onLogout(); setShowDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg transition font-medium ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50'}`}>Logout</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const Timer = ({ seconds, darkMode }) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <div className={`text-5xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} font-mono transition-colors`}>
      {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
};

const MetricCard = ({ icon, label, value, gradient, darkMode }) => {
  const colors = {
    blue: darkMode 
      ? 'border-blue-400 bg-gradient-to-br from-blue-900 to-blue-800' 
      : 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100',
    green: darkMode 
      ? 'border-green-400 bg-gradient-to-br from-green-900 to-green-800' 
      : 'border-green-400 bg-gradient-to-br from-green-50 to-green-100',
    purple: darkMode 
      ? 'border-purple-400 bg-gradient-to-br from-purple-900 to-purple-800' 
      : 'border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100'
  };
  
  return (
    <div className={`${colors[gradient]} border-l-4 rounded-2xl shadow-md hover:shadow-lg p-6 transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wide mb-2 transition-colors`}>{label}</p>
          <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{value}</p>
        </div>
        <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-2 transition-colors`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const Alert = ({ type = 'info', message, onClose, darkMode }) => {
  const colors = {
    error: darkMode ? 'bg-red-900 border-red-600 text-red-200' : 'bg-red-50 border-red-300 text-red-800',
    success: darkMode ? 'bg-green-900 border-green-600 text-green-200' : 'bg-green-50 border-green-300 text-green-800',
    info: darkMode ? 'bg-blue-900 border-blue-600 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800',
    warning: darkMode ? 'bg-yellow-900 border-yellow-600 text-yellow-200' : 'bg-yellow-50 border-yellow-300 text-yellow-800'
  };
  
  const icons = {
    error: '❌',
    success: '✅',
    info: 'ℹ️',
    warning: '⚠️'
  };

  return (
    <div className={`${colors[type]} border-2 rounded-xl p-3 mb-3 flex items-start justify-between`}>
      <div className="flex items-center space-x-2">
        <span className="text-xl">{icons[type]}</span>
        <p className="flex-1 font-semibold text-sm">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="ml-3 text-gray-600 hover:text-gray-800 font-bold">
          ✕
        </button>
      )}
    </div>
  );
};

// Interactive Word Highlighting Component
const InteractivePassageHighlight = ({ groundTruthWords, asrWords, opcodes }) => {
  const [hoveredWord, setHoveredWord] = useState(null);
  
  if (!groundTruthWords || !asrWords || !opcodes) {
    return null;
  }

  // Create a map of word index to opcode info
  const wordMap = {};
  opcodes.forEach(([tag, i1, i2, j1, j2]) => {
    for (let i = i1; i < i2; i++) {
      wordMap[i] = {
        tag,
        originalWord: groundTruthWords[i],
        spokenWord: tag === 'replace' && j1 < j2 ? asrWords[j1 + (i - i1)] : null,
        isInsert: tag === 'insert',
        j1, j2, i1, i2
      };
    }
  });

  const getWordStyle = (tag) => {
    switch (tag) {
      case 'equal':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'delete':
        return 'bg-red-100 text-red-800 line-through border-red-300';
      case 'replace':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getIcon = (tag) => {
    switch (tag) {
      case 'equal':
        return '✓';
      case 'delete':
        return '✗';
      case 'replace':
        return '⚠';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-inner border-2 border-indigo-200">
      <div className="mb-4 flex gap-4 text-xs font-bold">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
          <span className="text-gray-600">Correct</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-red-100 border border-red-300 rounded"></span>
          <span className="text-gray-600">Omitted</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></span>
          <span className="text-gray-600">Substituted</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded"></span>
          <span className="text-gray-600">Inserted</span>
        </div>
      </div>
      
      <div className="leading-relaxed text-lg">
        {groundTruthWords.map((word, idx) => {
          const info = wordMap[idx] || { tag: 'equal', originalWord: word };
          const isHovered = hoveredWord === idx;
          
          return (
            <span key={idx} className="inline-block mr-1 mb-1">
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-lg border-2 font-medium
                  transition-all duration-200 cursor-default
                  ${getWordStyle(info.tag)}
                  ${isHovered ? 'scale-110 shadow-lg z-10 relative' : ''}
                `}
                onMouseEnter={() => setHoveredWord(idx)}
                onMouseLeave={() => setHoveredWord(null)}
              >
                <span className="text-xs opacity-70">{getIcon(info.tag)}</span>
                <span>{word}</span>
              </span>
              
              {/* Tooltip for replaced words */}
              {isHovered && info.tag === 'replace' && info.spokenWord && (
                <div className="absolute z-50 mt-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl animate-fadeIn">
                  <div className="font-bold text-yellow-300">Student said:</div>
                  <div className="text-blue-200">"{info.spokenWord}"</div>
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                </div>
              )}
            </span>
          );
        })}
      </div>
      
      {/* Show inserted words if any */}
      {opcodes.some(([tag]) => tag === 'insert') && (
        <div className="mt-6 pt-4 border-t-2 border-indigo-200">
          <div className="text-sm font-bold text-indigo-700 mb-2">🔵 Extra Words (Not in passage):</div>
          <div className="flex flex-wrap gap-2">
            {opcodes.filter(([tag]) => tag === 'insert').map(([tag, i1, i2, j1, j2], idx) => (
              <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg border-2 border-blue-300 font-medium text-sm">
                {asrWords.slice(j1, j2).join(' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// === MAIN APP COMPONENT ===

function App() {
  // State management
  const [showAuth, setShowAuth] = useState(false);
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  const openAuth = (page = 'login') => {
    setAuthPage(page);
    setShowAuth(true);
  };
  const closeAuth = () => setShowAuth(false);

  const openProfilePage = () => {
    // only allow when logged in
    if (!isLoggedIn) {
      openAuth('login');
      return;
    }
    setView('profile');
    try { window.location.hash = '#/profile'; } catch (e) {}
  };

  const handleLoginSuccess = (user, token) => {
    // Ensure user object includes name when available
    const u = { ...user, name: user.name || '' };
    setCurrentUser(u);
    setIsLoggedIn(true);
    setShowAuth(false);
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(u));
    setAuthToken(token);
    // Set view to dashboard after login
    setView('dashboard');
    try { window.location.hash = ''; } catch (e) {}
  };

  const handleLogout = () => {
    // Inform backend to invalidate token when possible
    if (authToken) {
      axios.post(`${API_URL}/auth/logout`, {}, { headers: { Authorization: authToken } }).catch((e) => console.warn('Logout request failed', e));
    }
    setCurrentUser(null);
    setIsLoggedIn(false);
    // Clear localStorage so landing page shows on next visit
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setAuthToken(null);
  };

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Always show landing page first - no auto-login from localStorage
  // Login state resets every time the app/server restarts
  useEffect(() => {
    // Intentionally NOT restoring login state from localStorage
    // This ensures landing page always shows first and login is required after server restart
    setIsLoggedIn(false);
    setCurrentUser(null);
  }, []);

  // Keep view in sync with URL hash so browser Back works (e.g. back from #/profile -> record)
  useEffect(() => {
    function onHashChange() {
      try {
        const h = window.location.hash || '';
        if (h === '#/profile') {
          setView('profile');
        } else if (h === '#/record') {
          setView('record');
        } else if (h === '#/history') {
          setView('history');
        } else {
          // default to dashboard for empty hash
          setView('dashboard');
        }
      } catch (e) {
        // ignore
      }
    }
    // initialize from current hash
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [passages, setPassages] = useState([]);
  const [selectedPassageId, setSelectedPassageId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  
  // Student information state
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Fetch passages and students on mount
  useEffect(() => {
    const fetchPassages = async () => {
      try {
        console.log("Fetching passages from:", `${API_URL}/passages`);
        const response = await axios.get(`${API_URL}/passages`);
        console.log("Passages received:", response.data);
        setPassages(response.data);
        if (response.data.length > 0) {
          setSelectedPassageId(response.data[0]._id);
        }
      } catch (err) {
        console.error("Error fetching passages:", err);
        setError("Could not load passages. Please ensure the backend server is running.");
      }
    };

    const fetchStudents = async () => {
      try {
        const teacherId = currentUser?.id || 'default_teacher';
        const response = await axios.get(`${API_URL}/students`, {
          params: { teacher_id: teacherId }
        });
        setStudentsList(response.data);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchPassages();
    fetchStudents();
  }, [currentUser]);

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
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
        {!isLoggedIn ? (
          // Show Landing Page + Auth Modal
          <>
            <LandingPage onGetStarted={() => openAuth('login')} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            {/* Auth Modal */}
            {showAuth && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
                <div className="relative w-full max-w-md mx-auto">
                  <button onClick={closeAuth} className={`absolute -top-3 -right-3 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100'} rounded-full shadow-lg p-2 transition`}>✕</button>
                  {authPage === 'login' && <div className="p-4"><Login onClose={closeAuth} onSwitch={(p) => setAuthPage(p)} onLoginSuccess={handleLoginSuccess} /></div>}
                  {authPage === 'signup' && <div className="p-4"><Signup onClose={closeAuth} onSwitch={(p) => setAuthPage(p)} onLoginSuccess={handleLoginSuccess} /></div>}
                  {authPage === 'forgot' && <div className="p-4"><ForgotPassword onClose={closeAuth} onSwitch={(p) => setAuthPage(p)} /></div>}
              </div>
            </div>
          )}

          {/* Profile is now a dedicated page (see Header 'View Profile') */}
        </>
      ) : (
        // Show Dashboard
        <>
          <Header onLoginClick={() => openAuth('login')} onLogout={handleLogout} currentUser={currentUser} onViewProfile={openProfilePage} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

          {/* Profile Page */}
          {view === 'profile' && (
            <div className="container mx-auto px-4 py-8">
              <Profile user={currentUser} token={authToken} onClose={() => setView('record')} onUpdateUser={(u) => setCurrentUser(u)} onLogout={() => { handleLogout(); setView('record'); }} />
            </div>
          )}

          {view !== 'profile' && (
            <>
              {/* Navigation Tabs */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-md border-b transition-colors`}>
        <div className="container mx-auto px-4">
          <div className="flex space-x-6">
            <button
              onClick={() => setView('dashboard')}
              className={`py-3 px-6 border-b-2 font-semibold text-sm transition-all ${
                view === 'dashboard'
                  ? darkMode ? 'border-white text-white' : 'border-gray-900 text-gray-900'
                  : darkMode ? 'border-transparent text-gray-400 hover:text-white hover:border-gray-500' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-xl">🏠</span>
                <span>Dashboard</span>
              </span>
            </button>
            <button
              onClick={() => setView('record')}
              className={`py-3 px-6 border-b-2 font-semibold text-sm transition-all ${
                view === 'record'
                  ? darkMode ? 'border-white text-white' : 'border-gray-900 text-gray-900'
                  : darkMode ? 'border-transparent text-gray-400 hover:text-white hover:border-gray-500' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-xl">🎤</span>
                <span>Record Reading</span>
              </span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className={`py-3 px-6 border-b-2 font-semibold text-sm transition-all ${darkMode ? 'border-transparent text-gray-400 hover:text-white hover:border-gray-500' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-xl">📤</span>
                <span>Upload Students</span>
              </span>
            </button>
            <button
              onClick={() => {
                setView('history');
                fetchHistory();
              }}
              className={`py-3 px-6 border-b-2 font-semibold text-sm transition-all ${
                view === 'history'
                  ? darkMode ? 'border-white text-white' : 'border-gray-900 text-gray-900'
                  : darkMode ? 'border-transparent text-gray-400 hover:text-white hover:border-gray-500' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
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

      <div className="container mx-auto px-4 py-6">
        {error && <Alert type="error" message={error} onClose={() => setError(null)} darkMode={darkMode} />}

        {view === 'dashboard' ? (
          <Dashboard setView={setView} darkMode={darkMode} />
        ) : view === 'record' ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column: Recording Controls */}
            <div className="space-y-4">
              {/* Student Information Form */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900 to-indigo-900 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'} rounded-2xl border p-6 shadow-md transition-colors`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    <span className="text-2xl mr-2">👦</span>
                    Student Info
                  </h2>
                  {(studentName || studentGrade || studentId) && (
                    <button
                      onClick={clearStudentInfo}
                      className={`text-xs font-semibold ${darkMode ? 'text-blue-300 hover:text-blue-100 bg-gray-800 border-blue-600' : 'text-blue-700 hover:text-blue-900 bg-white border-blue-300'} border px-3 py-1 rounded-full shadow-sm transition-colors`}
                      disabled={isRecording || isLoading}
                    >
                      New Student
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <label className={`block text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'} mb-1`}>
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                        const filtered = studentsList.filter(s => 
                          s.name.toLowerCase().includes(e.target.value.toLowerCase())
                        );
                        setFilteredStudents(filtered);
                        setShowStudentDropdown(e.target.value.length > 0 && filtered.length > 0);
                      }}
                      onFocus={(e) => {
                        if (e.target.value.length > 0) {
                          const filtered = studentsList.filter(s => 
                            s.name.toLowerCase().includes(e.target.value.toLowerCase())
                          );
                          setFilteredStudents(filtered);
                          setShowStudentDropdown(filtered.length > 0);
                        }
                      }}
                      disabled={isRecording || isLoading}
                      placeholder="Type student's name or select from list"
                      className={`w-full px-3 py-2 border-2 ${darkMode ? 'bg-gray-800 border-blue-600 text-white placeholder-gray-400' : 'bg-white border-blue-300 text-gray-900'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm font-medium transition-colors`}
                    />
                    {/* Student Dropdown */}
                    {showStudentDropdown && filteredStudents.length > 0 && (
                      <div className={`absolute z-10 w-full mt-1 ${darkMode ? 'bg-gray-800 border-blue-600' : 'bg-white border-blue-300'} border-2 rounded-xl shadow-lg max-h-48 overflow-y-auto`}>
                        {filteredStudents.map((student) => (
                          <button
                            key={student._id}
                            type="button"
                            onClick={async () => {
                              setStudentName(student.name);
                              setStudentGrade(student.grade || '');
                              setStudentId(student.student_id || '');
                              setShowStudentDropdown(false);
                              
                              // Fetch recommended passage for this student
                              try {
                                const response = await axios.get(`${API_URL}/students/${encodeURIComponent(student.name)}/recommended-passage`);
                                if (response.data.passage) {
                                  setSelectedPassageId(response.data.passage._id);
                                  console.log(`📚 Auto-selected Level ${response.data.current_level} passage for ${student.name}`);
                                }
                              } catch (err) {
                                console.error('Error fetching recommended passage:', err);
                              }
                            }}
                            className={`w-full text-left px-4 py-2 ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-blue-50 text-gray-900'} transition-colors flex items-center justify-between`}
                          >
                            <div>
                              <div className="font-semibold">{student.name}</div>
                              {student.grade && <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Grade: {student.grade}</div>}
                            </div>
                            {student.student_id && <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>ID: {student.student_id}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'} mb-1`}>
                        Grade
                      </label>
                      <input
                        type="text"
                        value={studentGrade}
                        onChange={(e) => setStudentGrade(e.target.value)}
                        disabled={isRecording || isLoading}
                        placeholder="Grade 2"
                        className={`w-full px-3 py-2 border-2 ${darkMode ? 'bg-gray-800 border-blue-600 text-white placeholder-gray-400' : 'bg-white border-blue-300 text-gray-900'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm font-medium transition-colors`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'} mb-1`}>
                        ID
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        disabled={isRecording || isLoading}
                        placeholder="Optional"
                        className={`w-full px-3 py-2 ${darkMode ? 'bg-gray-800 border-blue-600 text-white placeholder-gray-400' : 'bg-white border-blue-300 text-gray-900'} border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 text-sm shadow-sm transition-colors`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Passage Selection */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-pink-900 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'} rounded-2xl border p-6 shadow-md transition-colors`}>
                <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                  <span className="text-2xl mr-2">📖</span>
                  Choose Story
                </h2>
                <select
                  value={selectedPassageId || ''}
                  onChange={(e) => setSelectedPassageId(e.target.value)}
                  disabled={isRecording || isLoading || passages.length === 0}
                  className={`w-full px-3 py-2 border-2 ${darkMode ? 'bg-gray-800 border-purple-600 text-white' : 'bg-white border-purple-300 text-gray-900'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-bold text-sm transition-colors`}
                >
                  {passages.length === 0 ? (
                    <option value="">No stories available - Check MongoDB connection</option>
                  ) : (
                    passages.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.level} - {p.title || 'Untitled'}
                      </option>
                    ))
                  )}
                </select>
                {passages.length === 0 && (
                  <p className="mt-2 text-xs text-red-600 font-semibold">
                    ⚠️ Unable to load stories. Please ensure MongoDB is running and try refreshing the page.
                  </p>
                )}
              </div>

              {/* Recording Controls */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-pink-900 to-rose-900 border-pink-700' : 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200'} rounded-2xl border p-6 shadow-md transition-colors`}>
                <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                  <span className="text-2xl mr-2">🎙️</span>
                  Recording
                </h2>
                
                {/* Timer Display */}
                <div className={`flex justify-center items-center mb-4 p-6 ${darkMode ? 'bg-gray-800 border-pink-600' : 'bg-white border-pink-200'} rounded-xl border shadow-sm transition-colors`}>
                  <Timer seconds={recordingTime} darkMode={darkMode} />
                </div>

                {/* Control Buttons */}
                <div className="space-y-2">
                  {!isRecording && !hasRecording && (
                    <button
                      onClick={startRecording}
                      disabled={isLoading}
                      className={`w-full flex items-center justify-center space-x-2 ${darkMode ? 'bg-white hover:bg-gray-200 text-gray-900' : 'bg-gray-900 hover:bg-gray-800 text-white'} disabled:bg-gray-400 font-bold py-3 px-6 rounded-full transition-all text-base`}
                    >
                      <span className="text-xl">▶️</span>
                      <span>START RECORDING</span>
                    </button>
                  )}

                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full transition-all animate-pulse text-base"
                    >
                      <span className="text-xl">⏹️</span>
                      <span>STOP</span>
                    </button>
                  )}

                  {hasRecording && !isRecording && (
                    <>
                      <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center space-x-2 ${darkMode ? 'bg-white hover:bg-gray-200 text-gray-900' : 'bg-gray-900 hover:bg-gray-800 text-white'} disabled:bg-gray-400 font-bold py-3 px-6 rounded-full transition-all text-base`}
                      >
                        {isLoading ? (
                          <>
                            <Spinner />
                            <span className="text-sm">Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xl">✨</span>
                            <span>Analyze Reading</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetRecording}
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center space-x-2 border-2 ${darkMode ? 'border-gray-600 hover:border-gray-500 text-gray-300' : 'border-gray-300 hover:border-gray-400 text-gray-700'} disabled:border-gray-200 font-semibold py-2 px-4 rounded-full transition-all text-sm`}
                      >
                        <span>🔄</span>
                        <span>Try Again</span>
                      </button>
                    </>
                  )}
                </div>

                {recordingTime >= 60 && isRecording && (
                  <div className={`mt-3 p-3 ${darkMode ? 'bg-yellow-900 border-yellow-600 text-yellow-200' : 'bg-yellow-50 border-yellow-300 text-yellow-800'} border rounded-xl text-center transition-colors`}>
                    <p className="text-sm font-semibold">⏰ Time's up! Stop recording.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Passage Display & Results */}
            <div className="space-y-4">
              {/* Passage Display */}
              {selectedPassage && (
                <div className={`${darkMode ? 'bg-gradient-to-br from-amber-900 to-yellow-900 border-amber-700' : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'} rounded-2xl border p-6 shadow-md transition-colors`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPassage.title || 'Reading Passage'}</h2>
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">{selectedPassage.level}</span>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800 border-amber-600 text-gray-200' : 'bg-white border-amber-200 text-gray-800'} rounded-xl p-4 border shadow-sm transition-colors`}>
                    <p className="leading-relaxed text-base">{selectedPassage.text}</p>
                  </div>
                </div>
              )}

              {/* Results Display */}
              {report && (
                <div className="space-y-4">
                  <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center transition-colors`}>
                    <span className="text-3xl mr-2">🎉</span>
                    Reading Results
                  </h2>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                      label="Speed"
                      value={Math.round(report.wcpm)}
                      gradient="blue"
                      darkMode={darkMode}
                    />
                    <MetricCard
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      label="Accuracy"
                      value={`${Math.round(report.accuracy_percent)}%`}
                      gradient="green"
                      darkMode={darkMode}
                    />
                    <MetricCard
                      icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      label="Expression"
                      value={report.prosody_score}
                      gradient="purple"
                      darkMode={darkMode}
                    />
                    {/* NEW: Punctuation Awareness Metric */}
                    {report.punctuation_score !== undefined && (
                      <MetricCard
                        icon={
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                          </svg>
                        }
                        label="Punctuation"
                        value={`${Math.round(report.punctuation_score)}%`}
                        gradient="blue"
                      />
                    )}
                  </div>

                  {/* Additional Details */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600' : 'bg-gradient-to-br from-slate-50 to-gray-50 border-gray-200'} rounded-2xl border p-6 shadow-md transition-colors`}>
                    <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 transition-colors`}>📝 Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className={`${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-50 text-purple-700'} p-2 rounded-lg transition-colors`}>
                        <span className={`${darkMode ? 'text-purple-300' : 'text-gray-600'} block`}>Duration</span>
                        <span className={`font-bold ${darkMode ? 'text-purple-100' : 'text-purple-700'} text-lg`}>{report.duration_seconds}s</span>
                      </div>
                      <div className={`${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'} p-2 rounded-lg transition-colors`}>
                        <span className={`${darkMode ? 'text-blue-300' : 'text-gray-600'} block`}>Correct Words</span>
                        <span className={`font-bold ${darkMode ? 'text-blue-100' : 'text-blue-700'} text-lg`}>{report.correct_words}/{report.total_words}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Word Playback */}
                  {report.word_analysis && report.word_analysis.length > 0 && (
                    <InteractiveWordPlayback 
                      wordAnalysis={report.word_analysis}
                      passageText={selectedPassage?.text || ''}
                      audioPath={report.audio_path}
                    />
                  )}

                  {/* Punctuation Awareness - Pro-Level Metric */}
                  {report.punctuation_score !== undefined && (
                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-cyan-300">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">⏸️</span>
                        <h2 className="text-2xl font-black text-cyan-700">
                          Reading with Pauses
                          <span className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-1 rounded-full font-bold">
                            PRO
                          </span>
                        </h2>
                      </div>

                      {/* Simple Score Display */}
                      <div className="bg-white rounded-xl p-6 mb-4 text-center border-2 border-cyan-200">
                        <div className="text-6xl font-black mb-2" style={{
                          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {Math.round(report.punctuation_score)}%
                        </div>
                        <p className="text-lg font-bold text-gray-700">Pause Score</p>
                      </div>

                      {/* What This Means - Simple Explanation */}
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">💡</span>
                          <div>
                            <p className="font-bold text-blue-800 mb-2">What does this mean?</p>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {report.punctuation_score >= 80 
                                ? "🌟 Excellent! The student paused naturally at commas (,) and periods (.). This shows they understand the story!"
                                : report.punctuation_score >= 60
                                ? "✅ Good! The student paused at most punctuation marks. They're reading with understanding."
                                : report.punctuation_score >= 40
                                ? "📖 Developing. The student is learning to pause at punctuation. Practice will help!"
                                : "💡 Needs Practice. The student read without pausing at commas or periods. They may not understand the story yet."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Visual Breakdown - Show exactly what happened */}
                      <div className="bg-white rounded-xl p-4 border-2 border-cyan-200">
                        <p className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <span>📊</span>
                          What We Found:
                        </p>
                        
                        <div className="space-y-3">
                          {/* Good Pauses */}
                          <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 border-2 border-green-200">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">✓</span>
                              <span className="font-bold text-green-700">Good Pauses</span>
                            </div>
                            <div className="text-2xl font-black text-green-600">
                              {report.punctuation_details?.matched_pauses || 0}
                            </div>
                          </div>
                          
                          {/* Missed Pauses */}
                          <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3 border-2 border-orange-200">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">⚠️</span>
                              <span className="font-bold text-orange-700">Missed Pauses</span>
                            </div>
                            <div className="text-2xl font-black text-orange-600">
                              {((report.punctuation_details?.total_expected_pauses || 0) - (report.punctuation_details?.matched_pauses || 0))}
                            </div>
                          </div>

                          {/* Total Expected */}
                          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">🎯</span>
                              <span className="font-bold text-blue-700">Total Punctuation Marks</span>
                            </div>
                            <div className="text-2xl font-black text-blue-600">
                              {report.punctuation_details?.total_expected_pauses || 0}
                            </div>
                          </div>
                        </div>

                        {/* Simple Formula */}
                        <div className="mt-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border-2 border-purple-200">
                          <p className="text-center text-sm text-gray-600">
                            <span className="font-bold text-purple-700">Score = </span>
                            <span className="text-green-600 font-bold">{report.punctuation_details?.matched_pauses || 0}</span>
                            <span className="mx-1">÷</span>
                            <span className="text-blue-600 font-bold">{report.punctuation_details?.total_expected_pauses || 0}</span>
                            <span className="mx-1">×</span>
                            <span className="font-bold">100</span>
                          </p>
                        </div>
                      </div>

                      {/* Teacher Tip */}
                      <div className="mt-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-300">
                        <div className="flex items-start gap-2">
                          <span className="text-xl">👨‍🏫</span>
                          <div>
                            <p className="font-bold text-amber-800 text-sm">Teacher Tip:</p>
                            <p className="text-gray-700 text-xs leading-relaxed">
                              When students pause at punctuation, it shows they're reading for <strong>meaning</strong>, 
                              not just pronouncing words. Practice reading aloud together, emphasizing pauses at commas and periods.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Word-by-Word Comparison - Interactive Highlighting */}
                  {report.opcodes && report.ground_truth_words && report.asr_words && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-4 border-2 border-indigo-300">
                      <h3 className="text-base font-black text-indigo-700 mb-3 flex items-center">
                        <span className="text-2xl mr-2">🔍</span>
                        Interactive Word Analysis
                      </h3>
                      <InteractivePassageHighlight 
                        groundTruthWords={report.ground_truth_words}
                        asrWords={report.asr_words}
                        opcodes={report.opcodes}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* History View */
          <div className={`${darkMode ? 'bg-gray-800/90 border-purple-600' : 'bg-white/80 border-purple-200'} backdrop-blur-sm rounded-2xl shadow-xl p-4 border-2 transition-colors`}>
            <h2 className={`text-2xl font-black ${darkMode ? 'text-purple-400' : 'text-purple-700'} mb-4 flex items-center transition-colors`}>
              <span className="text-3xl mr-2">📚</span>
              All Scores
            </h2>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner />
                <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-bold transition-colors`}>Loading...</span>
              </div>
            ) : history.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors`}>
                <div className="text-6xl mb-3">📝</div>
                <p className="font-bold">No scores yet!</p>
                <p className="text-sm">Record a student to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={item._id} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-xl p-4 hover:shadow-lg transition-all shadow-sm`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm">
                        #{history.length - idx}
                      </span>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium transition-colors`}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Student Information */}
                    {item.student_name && (
                      <div className={`mb-3 p-3 ${darkMode ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'} rounded-lg border transition-colors`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">👦</span>
                          <div className="flex-1">
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} text-sm transition-colors`}>{item.student_name}</span>
                            {item.student_grade && <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} ml-2 text-xs font-medium transition-colors`}>• {item.student_grade}</span>}
                            {item.student_id && <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs ml-2 transition-colors`}>(ID: {item.student_id})</span>}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`${darkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800' : 'bg-gradient-to-br from-blue-50 to-blue-100'} border-l-4 border-blue-400 p-3 rounded-lg text-center shadow-sm transition-colors`}>
                        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold block transition-colors`}>Speed</span>
                        <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{Math.round(item.wcpm)}</p>
                      </div>
                      <div className={`${darkMode ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-gradient-to-br from-green-50 to-green-100'} border-l-4 border-green-400 p-3 rounded-lg text-center shadow-sm transition-colors`}>
                        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold block transition-colors`}>Accuracy</span>
                        <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{Math.round(item.accuracy_percent)}%</p>
                      </div>
                      <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800' : 'bg-gradient-to-br from-purple-50 to-purple-100'} border-l-4 border-purple-400 p-3 rounded-lg text-center shadow-sm transition-colors`}>
                        <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold block transition-colors`}>Speed</span>
                        <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{item.prosody_score}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Upload Modal */}
      {showUploadModal && (
        <StudentUpload
          onUploadSuccess={() => {
            setShowUploadModal(false);
            // Refresh students list
            const fetchStudents = async () => {
              try {
                const teacherId = currentUser?.id || 'default_teacher';
                const response = await axios.get(`${API_URL}/students`, {
                  params: { teacher_id: teacherId }
                });
                setStudentsList(response.data);
              } catch (err) {
                console.error("Error fetching students:", err);
              }
            };
            fetchStudents();
          }}
          onClose={() => setShowUploadModal(false)}
          darkMode={darkMode}
          currentUser={currentUser}
        />
      )}

            </>
          )}

          {/* Footer */}
          <footer className="bg-gradient-to-r from-purple-500 to-pink-500 mt-8 border-t-4 border-yellow-400">
            <div className="container mx-auto px-4 py-3">
              <p className="text-center text-white text-xs font-bold">
                ✨ Akshara - Making Reading Fun with AI Magic! 🎉
              </p>
            </div>
          </footer>
        </>
      )}
      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
