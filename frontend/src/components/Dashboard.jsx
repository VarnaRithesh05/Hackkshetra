import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
  </div>
);

const StatCard = ({ icon, label, value, borderColor, darkMode }) => (
  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-l-4 ${borderColor} rounded-xl p-6 shadow-sm hover:shadow-md transition-all`}>
    <div className="text-4xl mb-2">{icon}</div>
    <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2 transition-colors`}>{label}</p>
    <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{value}</p>
  </div>
);

export default function Dashboard({ setView, darkMode }) {
  const [classStats, setClassStats] = useState(null);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [readingGroups, setReadingGroups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all three analytics endpoints in parallel
      const [statsRes, atRiskRes, groupsRes] = await Promise.all([
        axios.get(`${API_URL}/class_stats`),
        axios.get(`${API_URL}/at_risk_students`),
        axios.get(`${API_URL}/reading_groups`)
      ]);

      setClassStats(statsRes.data);
      setAtRiskStudents(atRiskRes.data);
      setReadingGroups(groupsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <Spinner />
        <span className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-semibold transition-colors`}>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} relative overflow-hidden transition-colors`}>
      {/* Gradient Orbs Background */}
      <div className={`absolute top-0 left-0 w-[500px] h-[500px] ${darkMode ? 'bg-gradient-to-br from-emerald-900/20 to-teal-800/20' : 'bg-gradient-to-br from-emerald-200/40 to-teal-300/40'} rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 transition-colors`}></div>
      <div className={`absolute bottom-0 right-0 w-[500px] h-[500px] ${darkMode ? 'bg-gradient-to-br from-pink-900/20 to-rose-800/20' : 'bg-gradient-to-br from-pink-200/40 to-rose-300/40'} rounded-full blur-3xl translate-x-1/2 translate-y-1/2 transition-colors`}></div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-12 space-y-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-5xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center mb-3 transition-colors`}>
            <span className="text-5xl mr-3">📊</span>
            Class Dashboard
          </h1>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg transition-colors`}>Monitor your students' reading progress at a glance</p>
        </div>

        {error && (
          <div className={`${darkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-900'} border-2 rounded-2xl p-4 flex items-start space-x-3 transition-colors`}>
            <span className="text-2xl">❌</span>
            <div className="flex-1">
              <p className="font-bold">{error}</p>
              <button onClick={fetchDashboardData} className={`mt-2 text-sm ${darkMode ? 'text-red-300' : 'text-red-700'} underline font-semibold`}>Retry</button>
            </div>
          </div>
        )}

      {/* Class Statistics */}
      {classStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon="👥"
            label="Total Students"
            value={classStats.totalStudents || 0}
            borderColor="border-l-blue-500"
            darkMode={darkMode}
          />
          <StatCard
            icon="⚡"
            label="Avg Speed (WCPM)"
            value={Math.round(classStats.avgWcpm || 0)}
            darkMode={darkMode}
            borderColor="border-l-green-500"
          />
          <StatCard
            icon="🎯"
            label="Avg Accuracy"
            value={`${Math.round(classStats.avgAccuracy || 0)}%`}
            borderColor="border-l-purple-500"
            darkMode={darkMode}
          />
        </div>
      )}

      {/* Reading Groups Section */}
      {readingGroups && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Intervention Group */}
          <div className={`${darkMode ? 'bg-red-900/50 border-red-700' : 'bg-red-50 border-red-200'} border rounded-2xl p-6 transition-colors`}>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-red-300' : 'text-red-800'} mb-3 flex items-center transition-colors`}>
              <span className="text-2xl mr-2">🚨</span>
              Intervention
            </h2>
            <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'} mb-4 transition-colors`}>{readingGroups.intervention.length} students</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {readingGroups.intervention.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors`}>No students need intervention</p>
              ) : (
                readingGroups.intervention.map((student, idx) => (
                  <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 border-l-4 border-red-500 shadow-sm transition-colors`}>
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{student.student_name}</p>
                    <p className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-700'} transition-colors`}>Accuracy: {Math.round(student.accuracy_percent)}%</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructional Group */}
          <div className={`${darkMode ? 'bg-yellow-900/50 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-2xl p-6 transition-colors`}>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'} mb-3 flex items-center transition-colors`}>
              <span className="text-2xl mr-2">📚</span>
              Instructional
            </h2>
            <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-4 transition-colors`}>{readingGroups.instructional.length} students</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {readingGroups.instructional.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors`}>No students in this group</p>
              ) : (
                readingGroups.instructional.map((student, idx) => (
                  <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 border-l-4 border-yellow-500 shadow-sm transition-colors`}>
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{student.student_name}</p>
                    <p className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-700'} transition-colors`}>Accuracy: {Math.round(student.accuracy_percent)}%</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Independent Group */}
          <div className={`${darkMode ? 'bg-green-900/50 border-green-700' : 'bg-green-50 border-green-200'} border rounded-2xl p-6 transition-colors`}>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-green-300' : 'text-green-800'} mb-3 flex items-center transition-colors`}>
              <span className="text-2xl mr-2">⭐</span>
              Independent
            </h2>
            <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'} mb-4 transition-colors`}>{readingGroups.independent.length} students</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {readingGroups.independent.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors`}>No students yet</p>
              ) : (
                readingGroups.independent.map((student, idx) => (
                  <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-3 border-l-4 border-green-500 shadow-sm transition-colors`}>
                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{student.student_name}</p>
                    <p className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-700'} transition-colors`}>Accuracy: {Math.round(student.accuracy_percent)}%</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* At-Risk Students */}
      {atRiskStudents.length > 0 && (
        <div className={`${darkMode ? 'bg-orange-900/50 border-orange-700' : 'bg-orange-50 border-orange-200'} border rounded-2xl p-6 transition-colors`}>
          <h2 className={`text-xl font-black ${darkMode ? 'text-orange-300' : 'text-orange-800'} mb-4 flex items-center transition-colors`}>
            <span className="text-3xl mr-2">⚠️</span>
            Top At-Risk Students
          </h2>
          <p className={`text-sm ${darkMode ? 'text-orange-400' : 'text-orange-600'} mb-4 transition-colors`}>Students with accuracy below 90% - prioritize support</p>
          <div className="space-y-3">
            {atRiskStudents.map((student, idx) => (
              <div key={idx} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm border-l-4 border-orange-500 transition-colors`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`font-black ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors`}>{idx + 1}. {student.student_name}</p>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {Math.round(student.accuracy_percent)}%
                  </span>
                </div>
                <div className={`grid grid-cols-2 gap-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} transition-colors`}>
                  <div>
                    <p>Speed: <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'} transition-colors`}>{Math.round(student.wcpm)} WCPM</span></p>
                  </div>
                  <div>
                    <p>Expression: <span className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'} transition-colors`}>{student.prosody_score}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setView('record')}
          className={`px-8 py-4 border-2 rounded-full font-semibold transition-all flex items-center justify-center space-x-2 ${darkMode ? 'border-white bg-white text-gray-900 hover:bg-gray-200' : 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'}`}
        >
          <span className="text-2xl">🎤</span>
          <span>Record Reading</span>
        </button>
        <button
          onClick={() => setView('history')}
          className={`px-8 py-4 border-2 rounded-full font-semibold transition-all flex items-center justify-center space-x-2 ${darkMode ? 'border-white text-white hover:bg-white hover:text-gray-900' : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'}`}
        >
          <span className="text-2xl">📊</span>
          <span>View All Scores</span>
        </button>
      </div>
      </div>
    </div>
  );
}
