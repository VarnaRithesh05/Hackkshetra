import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

const API_URL = 'http://127.0.0.1:5000/api';

const AdvancedAnalytics = ({ darkMode }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('30'); // days
  const [selectedMetric, setSelectedMetric] = useState('wcpm');

  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/analytics/advanced`, {
        params: { days: timeFilter }
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl p-8 text-center`}>
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a78bfa'];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <span className="text-3xl">📊</span>
            Advanced Analytics
          </h2>
          <div className="flex gap-2">
            {['7', '30', '90', '365'].map(days => (
              <button
                key={days}
                onClick={() => setTimeFilter(days)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  timeFilter === days
                    ? 'bg-purple-600 text-white'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        {/* Key Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-50'} p-4 rounded-lg`}>
            <p className={`text-xs font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>Total Assessments</p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-blue-900'}`}>
              {analytics.summary.total_assessments}
            </p>
          </div>
          <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} p-4 rounded-lg`}>
            <p className={`text-xs font-semibold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>Avg WCPM</p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-green-900'}`}>
              {Math.round(analytics.summary.avg_wcpm)}
            </p>
          </div>
          <div className={`${darkMode ? 'bg-purple-900' : 'bg-purple-50'} p-4 rounded-lg`}>
            <p className={`text-xs font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>Avg Accuracy</p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-purple-900'}`}>
              {Math.round(analytics.summary.avg_accuracy)}%
            </p>
          </div>
          <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-50'} p-4 rounded-lg`}>
            <p className={`text-xs font-semibold ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>Active Students</p>
            <p className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-orange-900'}`}>
              {analytics.summary.unique_students}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Trends */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-lg`}>
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
          <span className="text-2xl">📈</span>
          Progress Over Time
        </h3>
        
        {/* Metric Selector */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'wcpm', label: 'Speed (WCPM)' },
            { key: 'accuracy', label: 'Accuracy' },
            { key: 'prosody', label: 'Expression' }
          ].map(metric => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                selectedMetric === metric.key
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analytics.trends}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="date" 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : 'white',
                border: '2px solid',
                borderColor: darkMode ? '#374151' : '#e5e7eb',
                borderRadius: '8px',
                color: darkMode ? 'white' : 'black'
              }}
            />
            <Area 
              type="monotone" 
              dataKey={selectedMetric} 
              stroke="#8884d8" 
              fillOpacity={1} 
              fill="url(#colorMetric)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Error Patterns & Struggling Words */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Common Error Patterns */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-lg`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
            <span className="text-2xl">🎯</span>
            Common Error Types
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.error_patterns}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.error_patterns.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Struggling Words */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-lg`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
            <span className="text-2xl">⚠️</span>
            Most Challenging Words
          </h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {analytics.struggling_words?.slice(0, 10).map((item, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-500">#{idx + 1}</span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.word}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-300 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500"
                      style={{ width: `${(item.error_count / item.total_occurrences) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-red-600">
                    {item.error_count} errors
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student Performance Distribution */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-lg`}>
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
          <span className="text-2xl">👥</span>
          Student Performance Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.performance_distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="range" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip 
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : 'white',
                border: '2px solid',
                borderColor: darkMode ? '#374151' : '#e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="students" fill="#8884d8" name="Number of Students" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Time of Day Analysis */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-lg`}>
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
          <span className="text-2xl">🕐</span>
          Performance by Time of Day
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={analytics.time_analysis}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="hour" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip 
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : 'white',
                border: '2px solid',
                borderColor: darkMode ? '#374151' : '#e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="avg_score" stroke="#82ca9d" name="Avg Score" strokeWidth={2} />
            <Line type="monotone" dataKey="assessments" stroke="#8884d8" name="Assessments" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
