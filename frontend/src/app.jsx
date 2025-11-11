import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Base URL for your Flask API
// In development, React (port 3000) and Flask (port 5000) are separate.
// We must use the full URL.
const API_URL = 'http://127.0.0.1:5000/api';

// --- Reusable Components ---
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Header = () => (
  <header className="w-full bg-white shadow-md p-4">
    <div className="container mx-auto flex items-center">
      <svg className="h-10 w-10 text-indigo-600" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" />
        <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
        <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
        <line x1="3" y1="6" x2="3" y2="19" />
        <line x1="12" y1="6" x2="12" y2="19" />
        <line x1="21" y1="6" x2="21" y2="19" />
      </svg>
      <h1 className="text-3xl font-bold text-gray-800 ml-3">
        Akshara
        <span className="text-xl text-indigo-500 font-normal ml-2">60-Second Reading Diagnostic</span>
      </h1>
    </div>
  </header>
);

const StatCard = ({ title, value, unit, color = 'text-indigo-600' }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
    <p className="mt-1">
      <span className={`text-4xl font-bold ${color}`}>{value}</span>
      {unit && <span className="text-lg font-medium text-gray-600 ml-1">{unit}</span>}
    </p>
  </div>
);

// --- Main App Component ---
function App() {
  const [passages, setPassages] = useState([]);
  const [selectedPassageId, setSelectedPassageId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('record'); // 'record' or 'history'
  const [history, setHistory] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // --- Data Fetching ---
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
        setError("Could not load passages. Please check the backend connection.");
      }
    };
    fetchPassages();
  }, []);

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

  // --- Audio Recording Logic ---
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Audio recording is not supported by this browser.");
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
      setReport(null);
      setError(null);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Could not start recording. Please ensure microphone permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // --- Analysis Logic ---
  const handleAnalyze = async () => {
    if (audioChunksRef.current.length === 0) {
      setError("No audio recorded. Please record the student first.");
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
      });
      setReport(response.data);
      audioChunksRef.current = [];
    } catch (err) {
      console.error("Error analyzing audio:", err);
      setError("Analysis failed. " + (err.response?.data?.error || "Please check the backend server."));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Helper ---
  const getSelectedPassageText = () => {
    const passage = passages.find(p => p._id === selectedPassageId);
    return passage ? passage.text : "Loading passages...";
  };

  // --- Render Functions ---
  const renderRecorderView = () => (
    <>
      {/* 1. Passage Selection */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Select Reading Passage</h2>
        <select
          value={selectedPassageId}
          onChange={(e) => setSelectedPassageId(e.target.value)}
          disabled={isRecording || isLoading}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          {passages.map((p) => (
            <option key={p._id} value={p._id}>{p.level}: {p.title}</option>
          ))}
        </select>
        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-60 overflow-y-auto">
          <p className="text-gray-700 text-lg leading-relaxed font-serif">
            {getSelectedPassageText()}
          </p>
        </div>
      </div>

      {/* 2. Record & Analyze */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Record and Analyze</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isLoading || !selectedPassageId}
              className="flex-1 justify-center inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"></path></svg>
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 justify-center inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 00-2 0v2a1 1 0 102 0V9zm4 0a1 1 0 10-2 0v2a1 1 0 102 0V9z" clipRule="evenodd"></path></svg>
              Stop Recording
            </button>
          )}
          <button
            onClick={handleAnalyze}
            disabled={isRecording || isLoading || audioChunksRef.current.length === 0}
            className="flex-1 justify-center inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 mt-4 sm:mt-0"
          >
            {isLoading ? ( <><Spinner />Analyzing...</> ) : ( <> <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd"></path></svg>Analyze</> )}
          </button>
        </div>
      </div>

      {/* 3. Results */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}
      {report && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Diagnostic Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Speed" value={Math.round(report.wcpm)} unit="WCPM" color="text-green-600" />
            <StatCard title="Accuracy" value={Math.round(report.accuracy_percent)} unit="%" color="text-blue-600" />
            <StatCard title="Prosody" value={report.prosody_score} color="text-purple-600" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Detailed Miscue Analysis</h3>
            <div className="prose prose-sm max-w-none overflow-x-auto">
              <style>{`.diff-table { width: 100%; border-collapse: collapse; font-family: monospace; } .diff-table th { background: #f0f0f0; padding: 8px; border: 1px solid #ddd; text-align: left; } .diff-table td { padding: 8px; border: 1-px solid #ddd; vertical-align: top; } .diff_add { background: #e6ffed; } .diff_chg { background: #fff3e0; } .diff_sub { background: #ffebee; }`}</style>
              <div dangerouslySetInnerHTML={{ __html: report.diff_html.replace('<table', '<table class="diff-table"') }} />
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderHistoryView = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Report History</h2>
      {isLoading ? (
        <div className="flex justify-center items-center h-40"><Spinner /> <span className="ml-2 text-gray-600">Loading history...</span></div>
      ) : history.length === 0 ? (
        <p className="text-gray-600">No reports found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WCPM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-3 text-left text-xs font-static_folderme text-gray-500 uppercase tracking-wider">Prosody</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map(report => (
                <tr key={report._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(report.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{Math.round(report.wcpm)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{Math.round(report.accuracy_percent)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">{report.prosody_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // --- Main Return ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {/* View Toggler */}
        <div className="mb-6">
          <nav className="flex space-x-1 rounded-lg bg-gray-200 p-1.5" role="tablist">
            <button onClick={() => { setView('record'); setReport(null); setError(null); }} className={`w-full px-4 py-2 text-center font-medium rounded-md ${view === 'record' ? 'bg-white text-indigo-700 shadow' : 'text-gray-600 hover:bg-gray-300'}`}>
              New Assessment
            </button>
            <button onClick={() => { setView('history'); fetchHistory(); }} className={`w-full px-4 py-2 text-center font-medium rounded-md ${view === 'history' ? 'bg-white text-indigo-700 shadow' : 'text-gray-600 hover:bg-gray-300'}`}>
              View History
            </button>
          </nav>
        </div>
        {view === 'record' ? renderRecorderView() : renderHistoryView()}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        Project Akshara | AI Reading Diagnostic
      </footer>
    </div>
  );
}

export default App;


