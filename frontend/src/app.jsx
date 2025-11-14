import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ForgotPassword from './components/Auth/ForgotPassword';
import LandingPage from './components/LandingPage';
import Profile from './components/Profile';
import Dashboard from './components/Dashboard';
import InteractiveWordPlayback from './components/InteractiveWordPlayback';
import StudentTable from './components/StudentTable';
import StudentDashboard from './components/StudentDashboard';
import StudentUpload from './components/StudentUpload';
import UploadPassage from './components/UploadPassage';
import RealTimeFeedback from './components/RealTimeFeedback';
import AdvancedAnalytics from './components/AdvancedAnalytics';

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

const Header = ({ onLoginClick, onLogout, currentUser, onViewProfile, onLogoClick, darkMode, toggleDarkMode }) => {
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
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onLogoClick}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center text-xl shadow-md">📖</div>
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
              className={`p-2 rounded-full border-2 ${darkMode ? 'border-purple-600 hover:border-purple-500' : 'border-purple-300 hover:border-purple-400'} transition-all`}
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
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-full font-semibold transition-all text-sm shadow-lg hover:shadow-xl"
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
                  <div ref={dropdownRef} role="menu" aria-label="Profile menu" className={`absolute right-0 mt-12 w-44 ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'} rounded-xl shadow-lg border-2 p-2 z-50`}>
                    <button onClick={() => { onViewProfile && onViewProfile(); setShowDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg transition font-medium ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-purple-50'}`}>View Profile</button>
                    <button onClick={() => { onLogout && onLogout(); setShowDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg transition font-medium ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}>Logout</button>
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
      ? 'border-purple-500 bg-gradient-to-br from-purple-900 to-indigo-900' 
      : 'border-purple-500 bg-white',
    green: darkMode 
      ? 'border-green-500 bg-gradient-to-br from-green-900 to-emerald-900' 
      : 'border-green-500 bg-white',
    purple: darkMode 
      ? 'border-purple-500 bg-gradient-to-br from-purple-900 to-violet-900' 
      : 'border-purple-500 bg-white'
  };
  
  return (
    <div className={`${colors[gradient]} border-l-4 rounded-2xl shadow-xl hover:shadow-2xl p-6 transition-all border-2 ${darkMode ? 'border-purple-700' : 'border-purple-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold ${darkMode ? 'text-purple-300' : 'text-gray-600'} uppercase tracking-wide mb-2 transition-colors`}>{label}</p>
          <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{value}</p>
        </div>
        <div className={`${darkMode ? 'text-purple-400' : 'text-purple-500'} ml-2 transition-colors`}>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [history, setHistory] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  
  // Student information state
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showStoryDropdown, setShowStoryDropdown] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadPassage, setShowUploadPassage] = useState(false);

  // Student dashboard state
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAssessments, setStudentAssessments] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Fetch passages function
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

  // Fetch passages and students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const teacherId = currentUser?.id || 'default_teacher';
        const response = await axios.get(`${API_URL}/students/list`, {
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

  // Fetch history (keeping for future use)
  // const fetchHistory = async () => {
  //   try {
  //     setIsLoading(true);
  //     const response = await axios.get(`${API_URL}/reports`);
  //     setHistory(response.data);
  //     setError(null);
  //   } catch (err) {
  //     console.error("Error fetching history:", err);
  //     setError("Could not load report history.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // Fetch students
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/students/list`);
      setStudents(response.data);
      setStudentsList(response.data); // Also populate studentsList for dropdown
      setError(null);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Could not load students.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch student assessments
  const fetchStudentAssessments = async (studentName) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/students/${encodeURIComponent(studentName)}/assessments`);
      setStudentAssessments(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching student assessments:", err);
      setError("Could not load student assessments.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle student click
  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    await fetchStudentAssessments(student.name);
  };

  // Handle back to students table
  const handleBackToStudents = () => {
    setSelectedStudent(null);
    setStudentAssessments([]);
    setSelectedReport(null);
  };

  // Handle view detailed report
  const handleViewReport = (assessment) => {
    setSelectedReport(assessment);
  };

  // Recording functions
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Audio recording is not supported by this browser. Please use Chrome or Edge.");
      return;
    }
    try {
      // Request audio with noise suppression and echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      setAudioStream(stream); // Store stream for real-time feedback
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
    setAudioStream(null);
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
        // Show App with Side Panel
        <>
          <div className="flex h-screen overflow-hidden">
            {/* Side Panel */}
            <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col transition-all duration-300`}>
              {/* Logo Section */}
              <div className="p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center text-xl shadow-md">📖</div>
                    <div>
                      <h1 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>Akshara</h1>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xs font-medium`}>Reading Fluency AI</p>
                    </div>
                  </div>
                )}
                {sidebarCollapsed && (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center text-xl shadow-md mx-auto">📖</div>
                )}
              </div>

              {/* Toggle Button */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`mx-4 my-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} transition-colors flex items-center justify-center`}
              >
                {sidebarCollapsed ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                )}
              </button>

              {/* Navigation Menu */}
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <button
                  onClick={() => setView('dashboard')}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    view === 'dashboard'
                      ? darkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                      : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={sidebarCollapsed ? 'Dashboard' : ''}
                >
                  <span className="text-xl">📊</span>
                  {!sidebarCollapsed && <span>Dashboard</span>}
                </button>
                <button
                  onClick={() => setView('record')}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    view === 'record'
                      ? darkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                      : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={sidebarCollapsed ? 'Record Reading' : ''}
                >
                  <span className="text-xl">🎤</span>
                  {!sidebarCollapsed && <span>Record Reading</span>}
                </button>
                <button
                  onClick={() => {
                    setView('history');
                    fetchStudents();
                    setSelectedStudent(null);
                    setSelectedReport(null);
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    view === 'history'
                      ? darkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                      : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={sidebarCollapsed ? 'All Students' : ''}
                >
                  <span className="text-xl">👥</span>
                  {!sidebarCollapsed && <span>All Students</span>}
                </button>
                <button
                  onClick={() => setView('analytics')}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    view === 'analytics'
                      ? darkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                      : darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={sidebarCollapsed ? 'Analytics' : ''}
                >
                  <span className="text-xl">📈</span>
                  {!sidebarCollapsed && <span>Analytics</span>}
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl font-semibold text-sm transition-all ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  title={sidebarCollapsed ? 'Upload Students' : ''}
                >
                  <span className="text-xl">📤</span>
                  {!sidebarCollapsed && <span>Upload Students</span>}
                </button>
                <button
                  onClick={() => setShowUploadPassage(true)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl font-semibold text-sm transition-all ${darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
                  title={sidebarCollapsed ? 'Upload Passage' : ''}
                >
                  <span className="text-xl">📖</span>
                  {!sidebarCollapsed && <span>Upload Passage</span>}
                </button>
              </nav>

              {/* User Profile Section */}
              <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {!sidebarCollapsed ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${darkMode ? 'bg-purple-700' : 'bg-purple-200'} rounded-full flex items-center justify-center font-bold ${darkMode ? 'text-white' : 'text-purple-700'}`}>
                        {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                          {currentUser?.name || 'User'}
                        </p>
                        <button
                          onClick={openProfilePage}
                          className={`text-xs ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} font-medium`}
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                      aria-label="Toggle dark mode"
                    >
                      {darkMode ? (
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-red-400' : 'hover:bg-gray-100 text-red-600'} transition-colors`}
                      aria-label="Logout"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className={`w-10 h-10 ${darkMode ? 'bg-purple-700' : 'bg-purple-200'} rounded-full flex items-center justify-center font-bold ${darkMode ? 'text-white' : 'text-purple-700'} mx-auto`}>
                      {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`w-full p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors flex justify-center`}
                      aria-label="Toggle dark mode"
                    >
                      {darkMode ? (
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`w-full p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-red-400' : 'hover:bg-gray-100 text-red-600'} transition-colors flex justify-center`}
                      aria-label="Logout"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
              {/* Profile Page */}
              {view === 'profile' && (
                <div className="container mx-auto px-4 py-8">
                  <Profile user={currentUser} token={authToken} onClose={() => setView('dashboard')} onUpdateUser={(u) => setCurrentUser(u)} onLogout={() => { handleLogout(); }} />
                </div>
              )}

              {view !== 'profile' && (
                <>
                  {/* Page Header */}
                  <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-6 transition-colors`}>
                    <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {view === 'dashboard' && '📊 Dashboard'}
                      {view === 'record' && '🎤 Record Reading'}
                      {view === 'history' && '👥 All Students'}
                      {view === 'analytics' && '📈 Analytics'}
                    </h1>
                  </div>

                  {/* Main Content */}
                  <div className="p-6">
                    {error && <Alert type="error" message={error} onClose={() => setError(null)} darkMode={darkMode} />}

                    {view === 'dashboard' ? (
          <Dashboard setView={setView} darkMode={darkMode} />
        ) : view === 'record' ? (
          <div className="max-w-7xl mx-auto px-4 space-y-4">
            {/* Top Row: Student Information and Choose Story side by side */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Student Information - Left Column */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-700' : 'bg-white border-purple-200'} rounded-2xl border-2 p-6 shadow-xl transition-colors`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                    <span className="text-2xl mr-2">👦</span>
                    Student Information
                  </h2>
                  {(studentName || studentGrade || studentId) && (
                    <button
                      onClick={clearStudentInfo}
                      className={`text-xs font-semibold ${darkMode ? 'text-purple-300 hover:text-purple-100 bg-purple-800 hover:bg-purple-700' : 'text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'} px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all`}
                      disabled={isRecording || isLoading}
                    >
                      + New
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-purple-300' : 'text-gray-700'} mb-2`}>
                      Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={studentName}
                      onChange={async (e) => {
                        const selectedName = e.target.value;
                        setStudentName(selectedName);
                        
                        if (selectedName) {
                          // Find the selected student to populate grade and ID
                          const student = studentsList.find(s => s.name === selectedName);
                          if (student) {
                            setStudentGrade(student.grade || '');
                            setStudentId(student.student_id || '');
                            
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
                          }
                        } else {
                          setStudentGrade('');
                          setStudentId('');
                        }
                      }}
                      disabled={isRecording || isLoading}
                      className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-800 border-purple-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 text-sm font-medium transition-all shadow-sm hover:shadow-md`}
                    >
                      <option value="">Select a student...</option>
                      {studentsList.map((student) => (
                        <option key={student._id} value={student.name}>
                          {student.name} {student.grade ? `(Grade ${student.grade})` : ''} {student.student_id ? `- ID: ${student.student_id}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-purple-300' : 'text-gray-700'} mb-2`}>
                        Grade
                      </label>
                      <input
                        type="text"
                        value={studentGrade}
                        onChange={(e) => setStudentGrade(e.target.value)}
                        disabled={isRecording || isLoading}
                        placeholder="Grade 2"
                        className={`w-full px-4 py-3 border-2 ${darkMode ? 'bg-gray-800 border-purple-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 text-sm font-medium transition-all shadow-sm hover:shadow-md`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-purple-300' : 'text-gray-700'} mb-2`}>
                        ID
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        disabled={isRecording || isLoading}
                        placeholder="Optional"
                        className={`w-full px-4 py-3 border-2 ${darkMode ? 'bg-gray-800 border-purple-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'} rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 text-sm font-medium transition-all shadow-sm hover:shadow-md`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Choose Story - Right Column */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-700' : 'bg-white border-purple-200'} rounded-2xl border-2 p-6 shadow-xl transition-colors`}>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                  <span className="text-2xl mr-2">📖</span>
                  Choose Story
                </h2>
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedPassageId ? passages.find(p => p._id === selectedPassageId)?.level + ' - ' + (passages.find(p => p._id === selectedPassageId)?.title || 'Untitled') : ''}
                      onFocus={() => setShowStoryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowStoryDropdown(false), 200)}
                      disabled={isRecording || isLoading || passages.length === 0}
                      placeholder="Select a story..."
                      readOnly
                      className={`w-full px-4 py-3 pr-10 ${darkMode ? 'bg-gray-800 border-purple-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'} border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer text-sm font-medium transition-all shadow-sm hover:shadow-md`}
                    />
                    {/* Dropdown icon */}
                    <button
                      type="button"
                      onClick={() => setShowStoryDropdown(!showStoryDropdown)}
                      disabled={isRecording || isLoading || passages.length === 0}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-purple-400' : 'text-purple-600'} hover:opacity-70 transition-opacity`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {/* Story Dropdown */}
                  {showStoryDropdown && passages.length > 0 && (
                    <div className={`absolute z-10 w-full mt-1 ${darkMode ? 'bg-gray-800 border-purple-600' : 'bg-white border-purple-300'} border-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto`}>
                      {passages.map((passage) => (
                        <button
                          key={passage._id}
                          type="button"
                          onClick={() => {
                            setSelectedPassageId(passage._id);
                            setShowStoryDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 ${darkMode ? 'hover:bg-gray-700 text-white border-b border-gray-700' : 'hover:bg-purple-50 text-gray-900 border-b border-gray-100'} transition-colors flex items-center justify-between first:rounded-t-xl last:rounded-b-xl last:border-b-0 ${
                            selectedPassageId === passage._id ? (darkMode ? 'bg-gray-700' : 'bg-purple-50') : ''
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{passage.title || 'Untitled'}</div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{passage.level}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {passages.length === 0 && (
                  <p className="mt-2 text-xs text-red-600 font-semibold">
                    ⚠️ Unable to load stories. Please ensure MongoDB is running and try refreshing the page.
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Row: Reading Passage and Recording Controls side by side */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Reading Passage - Left Column */}
              {selectedPassage && (
                <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-700' : 'bg-white border-purple-200'} rounded-2xl border-2 p-6 shadow-xl transition-colors`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedPassage.title || 'Reading Passage'}</h2>
                    <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md">{selectedPassage.level}</span>
                  </div>
                  <div className={`${darkMode ? 'bg-gray-800 border-purple-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'} rounded-xl p-5 border-2 shadow-sm transition-colors max-h-96 overflow-y-auto`}>
                    <p className="leading-relaxed text-base">{selectedPassage.text}</p>
                  </div>
                </div>
              )}

              {/* Recording Controls - Right Column */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-700' : 'bg-white border-purple-200'} rounded-2xl border-2 p-6 shadow-xl transition-colors`}>
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                  <span className="text-2xl mr-2">🎙️</span>
                  Recording
                </h2>

                {/* Real-time Feedback - Inside Recording Card */}
                <div className="mb-4">
                  <RealTimeFeedback 
                    isRecording={isRecording}
                    stream={audioStream}
                    darkMode={darkMode}
                  />
                </div>
                
                {/* Timer Display */}
                <div className={`flex justify-center items-center mb-4 p-4 ${darkMode ? 'bg-gray-800 border-purple-600' : 'bg-gray-50 border-gray-200'} rounded-xl border-2 shadow-sm transition-colors`}>
                  <Timer seconds={recordingTime} darkMode={darkMode} />
                </div>

                {/* Control Buttons */}
                <div className="space-y-2">
                  {!isRecording && !hasRecording && (
                    <button
                      onClick={startRecording}
                      disabled={isLoading}
                      className={`w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white disabled:bg-gray-400 font-bold py-3 px-6 rounded-xl transition-all text-sm shadow-lg hover:shadow-xl`}
                    >
                      <span className="text-lg">▶️</span>
                      <span>START RECORDING</span>
                    </button>
                  )}

                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all animate-pulse text-sm shadow-lg"
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
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white disabled:bg-gray-400 font-bold py-3 px-6 rounded-xl transition-all text-sm shadow-lg hover:shadow-xl"
                      >
                        {isLoading ? (
                          <>
                            <Spinner />
                            <span className="text-xs">Analyzing...</span>
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
                        className={`w-full flex items-center justify-center space-x-2 border-2 ${darkMode ? 'border-purple-600 hover:border-purple-500 text-purple-300' : 'border-purple-200 hover:border-purple-300 text-purple-700'} disabled:border-gray-200 font-semibold py-2.5 px-5 rounded-xl transition-all text-sm hover:bg-purple-50`}
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

            {/* Results Display - Full Width Below */}
            {report && (
            <div className="mt-6 space-y-6">
              <div className={`${darkMode ? 'bg-gradient-to-r from-purple-900 to-indigo-900' : 'bg-gradient-to-r from-purple-500 to-indigo-600'} rounded-2xl p-6 shadow-xl`}>
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <span className="text-4xl mr-3">🎉</span>
                  Reading Results
                </h2>
              </div>
              
              {/* Main Results Layout */}
              <div className="space-y-6">
                {/* Top Section: Metrics Grid */}
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
                        darkMode={darkMode}
                      />
                    )}
                </div>

                {/* Two Column Layout: Level Progress + Details */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Level Progression Indicator - Compact */}
                  {(() => {
                    const accuracy = report.accuracy_percent || 0;
                    const prosody = report.prosody_score || 0;
                    const canLevelUp = accuracy >= 90 && prosody >= 80;
                    const shouldLevelDown = accuracy < 70 || prosody < 50;
                    
                    return (
                      <div className={`rounded-2xl border-2 p-4 shadow-lg ${
                        canLevelUp 
                          ? darkMode ? 'bg-gradient-to-br from-green-900 to-emerald-900 border-green-600' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                          : shouldLevelDown
                          ? darkMode ? 'bg-gradient-to-br from-orange-900 to-red-900 border-orange-600' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300'
                          : darkMode ? 'bg-gradient-to-br from-blue-900 to-indigo-900 border-blue-600' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
                      } transition-colors`}>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl">
                            {canLevelUp ? '🎉' : shouldLevelDown ? '💪' : '🎯'}
                          </span>
                          <div className="flex-1">
                            <h3 className={`text-xl font-black ${
                              canLevelUp 
                                ? darkMode ? 'text-green-200' : 'text-green-700'
                                : shouldLevelDown
                                ? darkMode ? 'text-orange-200' : 'text-orange-700'
                                : darkMode ? 'text-blue-200' : 'text-blue-700'
                            }`}>
                              {canLevelUp ? 'Outstanding! Level Up!' : shouldLevelDown ? 'Keep Practicing!' : 'Good Progress!'}
                            </h3>
                            <p className={`text-xs font-semibold ${
                              canLevelUp 
                                ? darkMode ? 'text-green-300' : 'text-green-600'
                                : shouldLevelDown
                                ? darkMode ? 'text-orange-300' : 'text-orange-600'
                                : darkMode ? 'text-blue-300' : 'text-blue-600'
                            }`}>
                              {canLevelUp 
                                ? 'You\'ve mastered this level! Moving to next challenge...'
                                : shouldLevelDown
                                ? 'Let\'s try an easier passage to build confidence'
                                : 'You\'re getting better! Try this level again to master it'}
                            </p>
                          </div>
                        </div>

                        <div className={`rounded-xl p-3 ${
                          canLevelUp
                            ? darkMode ? 'bg-green-800/50' : 'bg-green-100'
                            : shouldLevelDown
                            ? darkMode ? 'bg-orange-800/50' : 'bg-orange-100'
                            : darkMode ? 'bg-blue-800/50' : 'bg-blue-100'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${
                              canLevelUp 
                                ? darkMode ? 'text-green-200' : 'text-green-700'
                                : shouldLevelDown
                                ? darkMode ? 'text-orange-200' : 'text-orange-700'
                                : darkMode ? 'text-blue-200' : 'text-blue-700'
                            }`}>
                              Level Up Threshold
                            </span>
                            <span className={`text-[10px] font-bold ${
                              canLevelUp 
                                ? darkMode ? 'text-green-200' : 'text-green-700'
                                : darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Accuracy ≥90% AND Expression ≥80%
                            </span>
                          </div>
                          
                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className={`${accuracy >= 90 ? 'text-green-600' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {accuracy >= 90 ? '✓' : '○'}
                              </span>
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                Your Accuracy: <strong>{Math.round(accuracy)}%</strong> 
                                {accuracy >= 90 && ' ✨'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`${prosody >= 80 ? 'text-green-600' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {prosody >= 80 ? '✓' : '○'}
                              </span>
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                Your Expression: <strong>{Math.round(prosody)}%</strong>
                                {prosody >= 80 && ' ✨'}
                              </span>
                            </div>
                          </div>

                          {!canLevelUp && !shouldLevelDown && (
                            <div className={`mt-2.5 pt-2.5 border-t ${darkMode ? 'border-blue-700' : 'border-blue-200'}`}>
                              <p className={`text-[10px] font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                                💡 Tip: Focus on reading clearly and with expression to reach the next level!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Additional Details */}
                  <div className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-600' : 'bg-gradient-to-br from-slate-50 to-gray-50 border-gray-200'} rounded-2xl border p-4 shadow-md transition-colors`}>
                    <h3 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 transition-colors`}>📝 Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-50 text-purple-700'} p-2 rounded-lg transition-colors`}>
                        <span className={`${darkMode ? 'text-purple-300' : 'text-gray-600'} block text-[10px]`}>Duration</span>
                        <span className={`font-bold ${darkMode ? 'text-purple-100' : 'text-purple-700'} text-base`}>{report.duration_seconds}s</span>
                      </div>
                      <div className={`${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'} p-2 rounded-lg transition-colors`}>
                        <span className={`${darkMode ? 'text-blue-300' : 'text-gray-600'} block text-[10px]`}>Correct Words</span>
                        <span className={`font-bold ${darkMode ? 'text-blue-100' : 'text-blue-700'} text-base`}>{report.correct_words}/{report.total_words}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🎯 PHONETIC MISCUE ENGINE - "Good Errors" Display */}
                {report.phonetic_matches > 0 && report.phonetic_details && report.phonetic_details.length > 0 && (
                  <div className={`${darkMode ? 'bg-gradient-to-br from-green-900 to-emerald-900 border-green-700' : 'bg-white border-green-200'} rounded-2xl shadow-xl p-6 border-2 transition-colors`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🎯</span>
                      <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Phonetic Miscue Analysis
                        <span className="ml-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          AI POWERED
                        </span>
                      </h2>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid md:grid-cols-3 gap-3 mb-4">
                      <div className={`${darkMode ? 'bg-green-800/50 border-green-600' : 'bg-green-50 border-green-200'} rounded-xl p-4 text-center border-2`}>
                        <div className={`text-3xl font-black ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {report.exact_matches || 0}
                        </div>
                        <p className={`text-xs font-semibold mt-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Perfect Matches</p>
                      </div>
                      
                      <div className={`${darkMode ? 'bg-yellow-800/50 border-yellow-600' : 'bg-yellow-50 border-yellow-200'} rounded-xl p-4 text-center border-2`}>
                        <div className={`text-3xl font-black ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          {report.phonetic_matches}
                        </div>
                        <p className={`text-xs font-semibold mt-1 ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>Good Errors</p>
                        <p className={`text-[10px] ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>(Applying Phonics)</p>
                      </div>

                      <div className={`${darkMode ? 'bg-red-800/50 border-red-600' : 'bg-red-50 border-red-200'} rounded-xl p-4 text-center border-2`}>
                        <div className={`text-3xl font-black ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                          {report.miscue_analysis?.substitution_errors || 0}
                        </div>
                        <p className={`text-xs font-semibold mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>True Errors</p>
                      </div>
                    </div>

                    {/* What This Means */}
                    <div className={`${darkMode ? 'bg-green-900/50 border-green-700' : 'bg-green-50 border-green-200'} rounded-xl p-4 mb-4 border-2`}>
                      <div className="flex items-start gap-2">
                        <span className="text-xl">💡</span>
                        <div>
                          <p className={`font-bold text-sm mb-2 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>What are "Good Errors"?</p>
                          <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            When a student says "boot" instead of "boat", they're not guessing—they're <strong>applying phonics rules!</strong> 
                            Our AI Phonetic Miscue Engine identifies these "good errors" where the word <em>sounds similar</em> to the correct word. 
                            This shows the student understands <strong>sound-letter relationships</strong> and just needs practice with specific patterns.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Teaching Moments List */}
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4`}>
                      <h3 className={`text-sm font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        🎓 Teaching Moments ({report.phonetic_details.length})
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {report.phonetic_details.map((detail, idx) => (
                          <div key={idx} className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg p-3`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                  detail.confidence >= 90 ? 'bg-green-500 text-white' :
                                  detail.confidence >= 70 ? 'bg-yellow-500 text-white' :
                                  'bg-orange-500 text-white'
                                }`}>
                                  {detail.confidence}% Match
                                </span>
                                <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {detail.type === 'strong_phonetic' ? '⭐ Strong' :
                                   detail.type === 'moderate_phonetic' ? '⚡ Moderate' :
                                   '🔹 Weak'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{detail.said}</span>
                              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>→</span>
                              <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{detail.expected}</span>
                            </div>
                            <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              💬 Student applied phonics rules, sounds are similar
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Teacher Action */}
                    <div className={`${darkMode ? 'bg-blue-900/50 border-blue-700' : 'bg-blue-50 border-blue-200'} rounded-xl p-4 mt-4 border-2`}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg">👨‍🏫</span>
                        <div>
                          <p className={`font-bold text-sm mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Recommended Next Steps:</p>
                          <ul className={`text-xs leading-relaxed space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <li>✅ Praise the student for applying phonics correctly</li>
                            <li>📝 Practice vowel sounds and sight word recognition</li>
                            <li>🗣️ Focus on minimal pairs (boot/boat, ship/sheep)</li>
                            <li>🎯 These are <strong>teachable moments</strong>, not failures!</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Punctuation Awareness - Full Width Below */}
                {report.punctuation_score !== undefined && (
                  <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-700' : 'bg-white border-purple-200'} rounded-2xl shadow-xl p-6 border-2 transition-colors`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">⏸️</span>
                      <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Reading Pauses
                        <span className="ml-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          PRO
                        </span>
                      </h2>
                    </div>

                    {/* Horizontal Layout: Score and Breakdown */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Score Display */}
                      <div className={`${darkMode ? 'bg-gray-800 border-purple-600' : 'bg-gray-50 border-gray-200'} rounded-xl p-5 text-center border-2 transition-colors shadow-sm`}>
                        <div className="text-4xl font-black mb-2" style={{
                          background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {Math.round(report.punctuation_score)}%
                        </div>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pause Score</p>
                      </div>

                      {/* Visual Breakdown - Horizontal Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Good Pauses */}
                        <div className={`flex flex-col items-center justify-center rounded-lg p-2 border ${darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'} transition-colors`}>
                          <span className="text-lg mb-1">✓</span>
                          <div className={`text-xl font-black ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {report.punctuation_details?.matched_pauses || 0}
                          </div>
                          <span className={`font-bold text-[10px] ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Good</span>
                        </div>
                        
                        {/* Missed Pauses */}
                        <div className={`flex flex-col items-center justify-center rounded-lg p-2 border ${darkMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200'} transition-colors`}>
                          <span className="text-lg mb-1">⚠️</span>
                          <div className={`text-xl font-black ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            {((report.punctuation_details?.total_expected_pauses || 0) - (report.punctuation_details?.matched_pauses || 0))}
                          </div>
                          <span className={`font-bold text-[10px] ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>Missed</span>
                        </div>

                        {/* Total Expected */}
                        <div className={`flex flex-col items-center justify-center rounded-lg p-2 border ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} transition-colors`}>
                          <span className="text-lg mb-1">🎯</span>
                          <div className={`text-xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {report.punctuation_details?.total_expected_pauses || 0}
                          </div>
                          <span className={`font-bold text-[10px] ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Total</span>
                        </div>
                      </div>
                    </div>

                    {/* What This Means - Full Width */}
                    <div className={`${darkMode ? 'bg-purple-900/50 border-purple-700' : 'bg-purple-50 border-purple-200'} rounded-xl p-4 mb-4 border-2 transition-colors`}>
                      <div className="flex items-start gap-2">
                        <span className="text-xl">💡</span>
                        <div>
                          <p className={`font-bold text-sm mb-2 ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>What does this mean?</p>
                          <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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

                    {/* Bottom Row: Formula and Tip */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Simple Formula */}
                      <div className={`rounded-xl p-4 border-2 flex items-center justify-center ${darkMode ? 'bg-gray-800 border-purple-700' : 'bg-gray-50 border-gray-200'} transition-colors shadow-sm`}>
                        <p className={`text-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className={`font-bold ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>Score = </span>
                          <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{report.punctuation_details?.matched_pauses || 0}</span>
                          <span className="mx-1">÷</span>
                          <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{report.punctuation_details?.total_expected_pauses || 0}</span>
                          <span className="mx-1">×</span>
                          <span className="font-bold">100</span>
                        </p>
                      </div>

                      {/* Teacher Tip */}
                      <div className={`rounded-xl p-4 border-2 ${darkMode ? 'bg-gray-800 border-purple-700' : 'bg-gray-50 border-gray-200'} transition-colors shadow-sm`}>
                        <div className="flex items-start gap-2">
                          <span className="text-lg">👨‍🏫</span>
                          <div>
                            <p className={`font-bold text-sm mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>Teacher Tip:</p>
                            <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              When students pause at punctuation, it shows they're reading for <strong>meaning</strong>, not just pronouncing words.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expression & Tone Analysis - NEW! */}
                {report.expression_score !== undefined && report.expression_score !== "N/A" && report.expression_score !== "Error" && (
                  <div className={`${darkMode ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-purple-700' : 'bg-white border-purple-200'} rounded-2xl shadow-xl p-6 border-2 transition-colors`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">🎤</span>
                      <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Expression & Tone
                        <span className="ml-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          NEW
                        </span>
                      </h2>
                    </div>

                    {/* Score and Engagement Level */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Expression Score */}
                      <div className={`${darkMode ? 'bg-gray-800 border-purple-600' : 'bg-gray-50 border-gray-200'} rounded-xl p-5 text-center border-2 transition-colors shadow-sm`}>
                        <div className="text-4xl font-black mb-2" style={{
                          background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {Math.round(report.expression_score)}/100
                        </div>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Expression Score</p>
                      </div>

                      {/* Emotional Engagement */}
                      <div className={`${darkMode ? 'bg-gray-800 border-purple-600' : 'bg-gray-50 border-gray-200'} rounded-xl p-5 text-center border-2 transition-colors shadow-sm`}>
                        <div className={`text-2xl font-black mb-2 ${
                          report.expression_details?.emotional_engagement === 'Highly Expressive' ? 'text-green-500' :
                          report.expression_details?.emotional_engagement === 'Expressive' ? 'text-blue-500' :
                          report.expression_details?.emotional_engagement === 'Moderate' ? 'text-yellow-500' :
                          report.expression_details?.emotional_engagement === 'Somewhat Flat' ? 'text-orange-500' :
                          'text-red-500'
                        }`}>
                          {report.expression_details?.emotional_engagement || 'N/A'}
                        </div>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Engagement Level</p>
                      </div>
                    </div>

                    {/* Voice Metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {/* Pitch Variation */}
                      <div className={`flex flex-col items-center justify-center rounded-lg p-3 border ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} transition-colors`}>
                        <span className="text-xl mb-1">🎵</span>
                        <div className={`text-xl font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {Math.round(report.expression_details?.pitch_variation || 0)}%
                        </div>
                        <span className={`font-bold text-[10px] text-center ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Pitch<br/>Variation</span>
                      </div>
                      
                      {/* Energy Variation */}
                      <div className={`flex flex-col items-center justify-center rounded-lg p-3 border ${darkMode ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-200'} transition-colors`}>
                        <span className="text-xl mb-1">⚡</span>
                        <div className={`text-xl font-black ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                          {Math.round(report.expression_details?.energy_variation || 0)}%
                        </div>
                        <span className={`font-bold text-[10px] text-center ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}>Energy<br/>Dynamics</span>
                      </div>

                      {/* Voice Pitch */}
                      <div className={`flex flex-col items-center justify-center rounded-lg p-3 border ${darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} transition-colors`}>
                        <span className="text-xl mb-1">🔊</span>
                        <div className={`text-xl font-black ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          {Math.round(report.expression_details?.avg_pitch_hz || 0)}
                        </div>
                        <span className={`font-bold text-[10px] text-center ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Avg Pitch<br/>(Hz)</span>
                      </div>
                    </div>

                    {/* Reading Style Assessment */}
                    <div className={`${darkMode ? 'bg-purple-900/50 border-purple-700' : 'bg-purple-50 border-purple-200'} rounded-xl p-4 border-2 transition-colors`}>
                      <div className="flex items-start gap-2">
                        <span className="text-xl">🎭</span>
                        <div>
                          <p className={`font-bold text-sm mb-2 ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>Reading Style:</p>
                          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {report.expression_details?.reading_style || 'Unable to analyze'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* What This Means */}
                    <div className={`${darkMode ? 'bg-pink-900/50 border-pink-700' : 'bg-pink-50 border-pink-200'} rounded-xl p-4 mt-4 border-2 transition-colors`}>
                      <div className="flex items-start gap-2">
                        <span className="text-xl">💡</span>
                        <div>
                          <p className={`font-bold text-sm mb-2 ${darkMode ? 'text-pink-300' : 'text-pink-800'}`}>What does this mean?</p>
                          <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {report.expression_score >= 70
                              ? "🌟 Fantastic! The student reads with great expression - their voice goes up and down naturally, showing they understand emotions and meaning in the text!"
                              : report.expression_score >= 50
                              ? "✅ Good! The student shows decent expression with some vocal variation. Encourage them to be even more expressive!"
                              : report.expression_score >= 30
                              ? "📖 Developing. The student has limited vocal expression. Practice reading with different emotions and character voices!"
                              : "💡 Needs Practice. The reading sounds flat or monotone. Encourage acting out the story with different voices and emotions!"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Width: Interactive Word Playback */}
                {report.word_analysis && report.word_analysis.length > 0 && (
                  <InteractiveWordPlayback 
                    wordAnalysis={report.word_analysis}
                    passageText={selectedPassage?.text || ''}
                    audioPath={report.audio_path}
                    opcodes={report.opcodes}
                    asrWords={report.asr_words}
                  />
                )}
              </div>
            </div>
          )}
          </div>
        ) : view === 'uploads' ? (
          <StudentTable />
        ) : view === 'table' ? (
          <StudentDashboard darkMode={darkMode} />
        ) : view === 'profile' ? (
          <Profile darkMode={darkMode} setView={setView} />
        ) : view === 'analytics' ? (
          <AdvancedAnalytics darkMode={darkMode} />
        ) : view === 'passage' ? (
          <UploadPassage darkMode={darkMode} />
        ) : selectedReport ? (
          /* Detailed Report View */
          <div className={`${darkMode ? 'bg-gray-800/90 border-purple-600' : 'bg-white/80 border-purple-200'} backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 transition-colors`}>
            <button
              onClick={() => setSelectedReport(null)}
              className="mb-6 px-6 py-3 rounded-xl font-bold transition-all bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
            >
              ← Back to Student Dashboard
            </button>
            
            {/* Show the full report details here - reuse existing report display */}
            <div className={`${darkMode ? 'bg-gray-900/50' : 'bg-white'} rounded-xl p-6`}>
              <h2 className={`text-3xl font-black mb-6 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                Assessment Details
              </h2>
              
              {/* Display passage */}
              {selectedReport.passage_text && (
                <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border-2`}>
                  <h3 className={`font-bold mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>Passage:</h3>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{selectedReport.passage_text}</p>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className={`${darkMode ? 'bg-purple-900 border-purple-700' : 'bg-white border-purple-200'} p-5 rounded-xl border-2 shadow-lg transition-colors`}>
                  <span className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-purple-300' : 'text-gray-600'}`}>Speed</span>
                  <span className={`font-black text-3xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(selectedReport.wcpm)}</span>
                </div>
                <div className={`${darkMode ? 'bg-green-900 border-green-700' : 'bg-white border-green-200'} p-5 rounded-xl border-2 shadow-lg transition-colors`}>
                  <span className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-green-300' : 'text-gray-600'}`}>Accuracy</span>
                  <span className={`font-black text-3xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(selectedReport.accuracy_percent)}%</span>
                </div>
                <div className={`${darkMode ? 'bg-purple-900 border-purple-700' : 'bg-white border-purple-200'} p-5 rounded-xl border-2 shadow-lg transition-colors`}>
                  <span className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-purple-300' : 'text-gray-600'}`}>Prosody</span>
                  <span className={`font-black text-3xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedReport.prosody_score}</span>
                </div>
                <div className={`${darkMode ? 'bg-purple-900 border-purple-700' : 'bg-white border-purple-200'} p-5 rounded-xl border-2 shadow-lg transition-colors`}>
                  <span className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-purple-300' : 'text-gray-600'}`}>Punctuation</span>
                  <span className={`font-black text-3xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedReport.punctuation_score ? Math.round(selectedReport.punctuation_score) : 0}%</span>
                </div>
              </div>

              {/* Interactive Word Playback */}
              {selectedReport.word_analysis && selectedReport.word_analysis.length > 0 && (
                <InteractiveWordPlayback 
                  wordAnalysis={selectedReport.word_analysis}
                  passageText={selectedReport.passage_text || ''}
                  audioPath={selectedReport.audio_path}
                  opcodes={selectedReport.opcodes}
                  asrWords={selectedReport.asr_words}
                />
              )}
            </div>
          </div>
        ) : selectedStudent ? (
          /* Student Dashboard */
          <StudentDashboard 
            student={selectedStudent}
            assessments={studentAssessments}
            onBack={handleBackToStudents}
            onViewReport={handleViewReport}
            darkMode={darkMode}
          />
        ) : view === 'analytics' ? (
          /* Advanced Analytics View */
          <AdvancedAnalytics darkMode={darkMode} />
        ) : (
          /* Student Table View */
          <StudentTable 
            students={students}
            onStudentClick={handleStudentClick}
            darkMode={darkMode}
          />
        )}
                  </div>
                </>
              )}
            </div>
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
                const response = await axios.get(`${API_URL}/students/list`, {
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

      {/* Upload Passage Modal */}
      {showUploadPassage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-2xl mx-auto">
            <button 
              onClick={() => setShowUploadPassage(false)} 
              className={`absolute -top-3 -right-3 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100'} rounded-full shadow-lg p-2 transition z-10`}
            >
              ✕
            </button>
            <UploadPassage 
              onClose={() => setShowUploadPassage(false)} 
              onPassageAdded={fetchPassages}
            />
          </div>
        </div>
      )}
        </>
      )}
      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
