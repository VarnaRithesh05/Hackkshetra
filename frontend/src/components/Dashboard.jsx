import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl shadow-lg p-6 text-white`}>
    <div className="text-4xl mb-2">{icon}</div>
    <p className="text-sm font-bold opacity-80">{label}</p>
    <p className="text-4xl font-black">{value}</p>
  </div>
);

export default function Dashboard({ setView }) {
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
      <div className="flex justify-center items-center py-16">
        <Spinner />
        <span className="ml-3 text-gray-600 font-bold">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 flex items-center">
          <span className="text-4xl mr-2">📊</span>
          Class Dashboard
        </h1>
        <p className="text-gray-600 text-sm font-bold mt-1">Monitor your students' reading progress at a glance</p>
      </div>

      {error && (
        <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 text-red-800 font-bold">
          {error}
          <button onClick={fetchDashboardData} className="ml-3 underline font-black">Retry</button>
        </div>
      )}

      {/* Class Statistics */}
      {classStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon="👥"
            label="Total Students"
            value={classStats.totalStudents || 0}
            color="from-blue-400 to-cyan-400"
          />
          <StatCard
            icon="⚡"
            label="Avg Speed (WCPM)"
            value={Math.round(classStats.avgWcpm || 0)}
            color="from-green-400 to-emerald-400"
          />
          <StatCard
            icon="🎯"
            label="Avg Accuracy"
            value={`${Math.round(classStats.avgAccuracy || 0)}%`}
            color="from-purple-400 to-pink-400"
          />
        </div>
      )}

      {/* Reading Groups Section */}
      {readingGroups && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Intervention Group */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
            <h2 className="text-lg font-black text-red-700 mb-3 flex items-center">
              <span className="text-2xl mr-2">🚨</span>
              Intervention
            </h2>
            <p className="text-xs text-red-600 font-bold mb-3">{readingGroups.intervention.length} students</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {readingGroups.intervention.length === 0 ? (
                <p className="text-sm text-gray-600">No students need intervention</p>
              ) : (
                readingGroups.intervention.map((student, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 border-l-4 border-red-500">
                    <p className="text-sm font-black text-gray-800">{student.student_name}</p>
                    <p className="text-xs text-red-700">Accuracy: {Math.round(student.accuracy_percent)}%</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructional Group */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-lg p-6 border-2 border-yellow-200">
            <h2 className="text-lg font-black text-amber-700 mb-3 flex items-center">
              <span className="text-2xl mr-2">📚</span>
              Instructional
            </h2>
            <p className="text-xs text-amber-600 font-bold mb-3">{readingGroups.instructional.length} students</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {readingGroups.instructional.length === 0 ? (
                <p className="text-sm text-gray-600">No students in this group</p>
              ) : (
                readingGroups.instructional.map((student, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 border-l-4 border-amber-500">
                    <p className="text-sm font-black text-gray-800">{student.student_name}</p>
                    <p className="text-xs text-amber-700">Accuracy: {Math.round(student.accuracy_percent)}%</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Independent Group */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <h2 className="text-lg font-black text-green-700 mb-3 flex items-center">
              <span className="text-2xl mr-2">⭐</span>
              Independent
            </h2>
            <p className="text-xs text-green-600 font-bold mb-3">{readingGroups.independent.length} students</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {readingGroups.independent.length === 0 ? (
                <p className="text-sm text-gray-600">No students yet</p>
              ) : (
                readingGroups.independent.map((student, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 border-l-4 border-green-500">
                    <p className="text-sm font-black text-gray-800">{student.student_name}</p>
                    <p className="text-xs text-green-700">Accuracy: {Math.round(student.accuracy_percent)}%</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* At-Risk Students */}
      {atRiskStudents.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-lg p-6 border-2 border-orange-300">
          <h2 className="text-lg font-black text-orange-700 mb-4 flex items-center">
            <span className="text-2xl mr-2">⚠️</span>
            Top At-Risk Students
          </h2>
          <p className="text-xs text-orange-600 font-bold mb-4">Students with accuracy below 90% - prioritize support</p>
          <div className="space-y-3">
            {atRiskStudents.map((student, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-md border-l-4 border-orange-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-black text-gray-800">{idx + 1}. {student.student_name}</p>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-black">
                    {Math.round(student.accuracy_percent)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Speed: <span className="font-bold text-gray-800">{Math.round(student.wcpm)} WCPM</span></p>
                  </div>
                  <div>
                    <p className="text-gray-600">Expression: <span className="font-bold text-gray-800">{student.prosody_score}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setView('record')}
          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black py-4 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center space-x-2"
        >
          <span className="text-2xl">🎤</span>
          <span>Record Reading</span>
        </button>
        <button
          onClick={() => setView('history')}
          className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-black py-4 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center space-x-2"
        >
          <span className="text-2xl">📊</span>
          <span>View All Scores</span>
        </button>
      </div>
    </div>
  );
}
