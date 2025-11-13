import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_URL = 'http://127.0.0.1:5000/api';

const StudentHistory = ({ studentName, onBack, darkMode }) => {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudentHistory();
  }, [studentName]);

  const fetchStudentHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/students/${encodeURIComponent(studentName)}/history`);
      setHistoryData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching student history:', err);
      setError('Failed to load student history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} font-semibold`}>Loading student history...</p>
        </div>
      </div>
    );
  }

  if (error || !historyData) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-8`}>
        <button
          onClick={onBack}
          className={`mb-6 px-4 py-2 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg border shadow-sm hover:shadow-md transition-all`}
        >
          ← Back
        </button>
        <div className={`${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-6 text-center`}>
          <p className={`${darkMode ? 'text-red-300' : 'text-red-700'} font-semibold`}>{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const { stats, trends, suggestions, chart_data, reports } = historyData;

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#e5e7eb' : '#1f2937',
          font: { size: 12, weight: 'bold' }
        }
      },
      tooltip: {
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        titleColor: darkMode ? '#ffffff' : '#000000',
        bodyColor: darkMode ? '#e5e7eb' : '#374151',
        borderColor: darkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb'
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280'
        }
      },
      x: {
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb'
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = {
    labels: chart_data.labels.map(formatDate),
    datasets: [
      {
        label: 'Pronunciation',
        data: chart_data.pronunciation,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Fluency',
        data: chart_data.fluency,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Punctuation',
        data: chart_data.punctuation,
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const wcpmData = {
    labels: chart_data.labels.map(formatDate),
    datasets: [
      {
        label: 'Words per Minute',
        data: chart_data.wcpm,
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <span className="text-green-500">📈 Improving</span>;
      case 'declining': return <span className="text-red-500">📉 Declining</span>;
      default: return <span className="text-blue-500">➡️ Stable</span>;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return darkMode ? 'bg-red-900 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700';
      case 'medium': return darkMode ? 'bg-yellow-900 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default: return darkMode ? 'bg-green-900 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} p-4 md:p-8`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className={`mb-6 px-4 py-2 ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50'} rounded-lg border shadow-sm transition-all font-semibold`}
        >
          ← Back to Recording
        </button>

        {/* Student Header */}
        <div className={`${darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-blue-100 to-purple-100'} rounded-2xl p-8 mb-8 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                📊 {studentName}'s Reading Progress
              </h1>
              <p className={`${darkMode ? 'text-blue-200' : 'text-blue-700'} font-semibold`}>
                Total Readings: {stats.total_readings}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`${darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-xl p-6 shadow-md`}>
            <div className="text-sm font-bold text-blue-500 mb-2">AVG PRONUNCIATION</div>
            <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stats.avg_pronunciation}%</div>
            <div className="text-sm">{getTrendIcon(trends.pronunciation)}</div>
          </div>

          <div className={`${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'} border rounded-xl p-6 shadow-md`}>
            <div className="text-sm font-bold text-green-500 mb-2">AVG FLUENCY</div>
            <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stats.avg_fluency}%</div>
            <div className="text-sm">{getTrendIcon(trends.fluency)}</div>
          </div>

          <div className={`${darkMode ? 'bg-orange-900 border-orange-700' : 'bg-orange-50 border-orange-200'} border rounded-xl p-6 shadow-md`}>
            <div className="text-sm font-bold text-orange-500 mb-2">AVG WCPM</div>
            <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stats.avg_wcpm}</div>
            <div className="text-sm">{getTrendIcon(trends.wcpm)}</div>
          </div>

          <div className={`${darkMode ? 'bg-purple-900 border-purple-700' : 'bg-purple-50 border-purple-200'} border rounded-xl p-6 shadow-md`}>
            <div className="text-sm font-bold text-purple-500 mb-2">AVG PUNCTUATION</div>
            <div className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{stats.avg_punctuation}%</div>
            <div className="text-sm">{getTrendIcon(trends.punctuation)}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`}>
            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Performance Metrics Over Time</h3>
            <div className="h-64">
              <Line options={chartOptions} data={chartData} />
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`}>
            <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Reading Speed (WCPM)</h3>
            <div className="h-64">
              <Line options={chartOptions} data={wcpmData} />
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg mb-8`}>
          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            💡 Personalized Teaching Suggestions
          </h3>
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className={`${getPriorityColor(suggestion.priority)} border rounded-xl p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-black text-sm uppercase">{suggestion.category}</span>
                    <p className="font-semibold mt-1">{suggestion.suggestion}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    suggestion.priority === 'high' ? 'bg-red-200 text-red-800' :
                    suggestion.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {suggestion.priority}
                  </span>
                </div>
                {suggestion.activities && suggestion.activities.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold mb-2">Recommended Activities:</p>
                    <ul className="text-sm space-y-1">
                      {suggestion.activities.map((activity, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-2">✓</span>
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Readings */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`}>
          <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>📚 Reading History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b-2`}>
                  <th className={`text-left p-3 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                  <th className={`text-left p-3 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pronunciation</th>
                  <th className={`text-left p-3 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fluency</th>
                  <th className={`text-left p-3 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>WCPM</th>
                  <th className={`text-left p-3 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Punctuation</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice().reverse().map((report, index) => (
                  <tr key={index} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}>
                    <td className={`p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className={`p-3 font-bold ${report.accuracy_percent >= 90 ? 'text-green-500' : report.accuracy_percent >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {report.accuracy_percent}%
                    </td>
                    <td className={`p-3 font-bold ${report.prosody_score >= 80 ? 'text-green-500' : report.prosody_score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {report.prosody_score}%
                    </td>
                    <td className={`p-3 font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      {report.wcpm}
                    </td>
                    <td className={`p-3 font-bold ${report.punctuation_details?.punctuation_score >= 70 ? 'text-green-500' : report.punctuation_details?.punctuation_score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {report.punctuation_details?.punctuation_score || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHistory;
