import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentDashboard = ({ student, assessments, onBack, onViewReport, darkMode }) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Safety check for empty assessments
  if (!assessments || assessments.length === 0) {
    return (
      <div className={`${darkMode ? 'bg-gray-800/90 border-purple-600' : 'bg-white/80 border-purple-200'} backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 transition-colors`}>
        <button
          onClick={onBack}
          className={`mb-4 px-4 py-2 rounded-lg font-bold transition-all ${
            darkMode 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          ← Back to All Students
        </button>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No Assessments Yet
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {student.name} hasn't completed any assessments yet.
          </p>
        </div>
      </div>
    );
  }

  // Calculate averages
  const avgWcpm = Math.round(assessments.reduce((sum, a) => sum + (a.wcpm || 0), 0) / assessments.length);
  const avgAccuracy = Math.round(assessments.reduce((sum, a) => sum + (a.accuracy_percent || 0), 0) / assessments.length);
  const avgProsody = assessments.reduce((sum, a) => sum + (a.prosody_score || 0), 0) / assessments.length;

  // Get reading level
  const getReadingLevel = () => {
    if (avgWcpm >= 100 && avgAccuracy >= 95) return { level: 'Independent', icon: '🌟', color: 'green' };
    if (avgWcpm >= 60 && avgAccuracy >= 85) return { level: 'Instructional', icon: '📖', color: 'blue' };
    return { level: 'Intervention', icon: '🎯', color: 'red' };
  };

  const levelInfo = getReadingLevel();

  // Prepare chart data
  const wcpmData = assessments.map((a, idx) => ({
    test: `Test ${idx + 1}`,
    date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    WCPM: Math.round(a.wcpm),
    fullDate: a.created_at
  }));

  const accuracyData = assessments.map((a, idx) => ({
    test: `Test ${idx + 1}`,
    date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Accuracy: Math.round(a.accuracy_percent),
    fullDate: a.created_at
  }));

  const prosodyData = assessments.map((a, idx) => ({
    test: `Test ${idx + 1}`,
    date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Prosody: a.prosody_score || 'Good',
    ProsodyNumeric: a.prosody_score === 'Good' ? 3 : a.prosody_score === 'Fair' ? 2 : 1,
    fullDate: a.created_at
  }));

  // Latest prosody breakdown for radar chart
  const latestAssessment = assessments[assessments.length - 1] || {};
  const radarData = [
    { metric: 'Pauses', score: latestAssessment.punctuation_score || 70 },
    { metric: 'Expression', score: latestAssessment.prosody_score === 'Good' ? 85 : 60 },
    { metric: 'Accuracy', score: latestAssessment.accuracy_percent || 0 },
    { metric: 'Speed', score: Math.min(100, ((latestAssessment.wcpm || 0) / 150) * 100) },
    { metric: 'Fluency', score: (latestAssessment.accuracy_percent || 0) * 0.6 + ((latestAssessment.wcpm || 0) / 150) * 40 }
  ];

  // Mistake breakdown from latest
  const mistakeData = latestAssessment && latestAssessment.opcodes ? 
    Object.entries(
      latestAssessment.opcodes.reduce((acc, op) => {
        const type = op[0];
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    ).map(([type, count]) => ({
      type: type === 'replace' ? 'Substitutions' : 
            type === 'delete' ? 'Omissions' : 
            type === 'insert' ? 'Additions' : 'Correct',
      count
    })).filter(d => d.type !== 'Correct')
    : [];

  return (
    <div className={`${darkMode ? 'bg-gray-800/90 border-purple-600' : 'bg-white/80 border-purple-200'} backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 transition-colors`}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className={`mb-4 px-4 py-2 rounded-lg font-bold transition-all ${
            darkMode 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          ← Back to All Students
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-black ${
              darkMode ? 'bg-purple-700 text-white' : 'bg-purple-200 text-purple-900'
            }`}>
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className={`text-4xl font-black ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                {student.name}
              </h1>
              <div className="flex items-center space-x-3 mt-1">
                {student.grade && (
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Grade: {student.grade}
                  </span>
                )}
                {student.studentId && (
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ID: {student.studentId}
                  </span>
                )}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  levelInfo.color === 'green' ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-200 text-green-900') :
                  levelInfo.color === 'blue' ? (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-200 text-blue-900') :
                  (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-200 text-red-900')
                }`}>
                  {levelInfo.icon} {levelInfo.level}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Assessments</p>
            <p className={`text-5xl font-black ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
              {assessments.length}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`rounded-xl p-6 border-2 ${
          darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">⚡</span>
            <span className={`text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>AVG SPEED</span>
          </div>
          <p className={`text-5xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgWcpm}</p>
          <p className={`text-sm font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Words/Minute</p>
        </div>

        <div className={`rounded-xl p-6 border-2 ${
          darkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">✓</span>
            <span className={`text-xs font-bold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>AVG ACCURACY</span>
          </div>
          <p className={`text-5xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgAccuracy}%</p>
          <p className={`text-sm font-semibold ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Correct Words</p>
        </div>

        <div className={`rounded-xl p-6 border-2 ${
          darkMode ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">😊</span>
            <span className={`text-xs font-bold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>PROSODY</span>
          </div>
          <p className={`text-5xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {(latestAssessment && latestAssessment.prosody_score) || 'Good'}
          </p>
          <p className={`text-sm font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Expression Level</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b-2 border-gray-300">
        {['overview', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-6 py-3 font-bold rounded-t-lg transition-all ${
              selectedTab === tab
                ? darkMode
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-600 text-white'
                : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab === 'overview' ? '📊 Performance Graphs' : '📋 Assessment History'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' ? (
        <div className="space-y-8">
          {/* WCPM Progress Chart */}
          <div className={`rounded-xl p-6 border-2 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-xl font-black mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              ⚡ Reading Speed Progress (WCPM)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={wcpmData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `2px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="WCPM" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Accuracy Progress Chart */}
          <div className={`rounded-xl p-6 border-2 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-xl font-black mb-4 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
              ✓ Accuracy Progress
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `2px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="Accuracy" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Skills Radar Chart */}
          <div className={`rounded-xl p-6 border-2 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-xl font-black mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
              🎯 Current Skills Profile
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={darkMode ? '#4b5563' : '#d1d5db'} />
                <PolarAngleAxis dataKey="metric" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                <Radar name="Skills" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    border: `2px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Assessment History Table */
        <div className={`rounded-xl border-2 overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
              <tr>
                <th className="px-6 py-4 text-left font-black text-sm">Date</th>
                <th className="px-6 py-4 text-center font-black text-sm">WCPM</th>
                <th className="px-6 py-4 text-center font-black text-sm">Accuracy</th>
                <th className="px-6 py-4 text-center font-black text-sm">Prosody</th>
                <th className="px-6 py-4 text-center font-black text-sm">Duration</th>
                <th className="px-6 py-4 text-center font-black text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment, idx) => (
                <tr key={assessment._id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {new Date(assessment.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full font-bold ${
                      darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-900'
                    }`}>
                      {Math.round(assessment.wcpm)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full font-bold ${
                      darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-900'
                    }`}>
                      {Math.round(assessment.accuracy_percent)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full font-bold ${
                      darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-900'
                    }`}>
                      {assessment.prosody_score || 'Good'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {assessment.duration ? `${assessment.duration.toFixed(1)}s` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onViewReport(assessment)}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        darkMode 
                          ? 'bg-purple-700 text-white hover:bg-purple-600' 
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
