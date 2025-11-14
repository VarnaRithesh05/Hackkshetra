import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_URL = 'http://127.0.0.1:5000/api';

const AdvancedAnalytics = ({ darkMode }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('30'); // days

  const fetchAnalytics = useCallback(async () => {
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
  }, [timeFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
            {[
              { value: '1', label: '1d' },
              { value: '7', label: '7d' },
              { value: '30', label: '1m' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  timeFilter === filter.value
                    ? 'bg-purple-600 text-white'
                    : darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filter.label}
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
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
          <span className="text-2xl">📈</span>
          Progress Over Time
        </h3>
        
        {/* Speed (WCPM) Chart */}
        <div className="mb-8">
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            Speed (WCPM)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="date" 
                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                style={{ fontSize: '12px' }}
                label={{ value: 'WCPM', angle: -90, position: 'insideLeft', style: { fill: darkMode ? '#9ca3af' : '#6b7280' } }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : 'white',
                  border: '2px solid',
                  borderColor: darkMode ? '#374151' : '#e5e7eb',
                  borderRadius: '8px',
                  color: darkMode ? 'white' : 'black'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="wcpm" 
                stroke="#8884d8" 
                strokeWidth={3}
                dot={{ fill: '#8884d8', r: 5 }}
                activeDot={{ r: 7 }}
                name="Speed (WCPM)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Accuracy Chart */}
        <div className="mb-8">
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
            Accuracy (%)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="date" 
                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', style: { fill: darkMode ? '#9ca3af' : '#6b7280' } }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : 'white',
                  border: '2px solid',
                  borderColor: darkMode ? '#374151' : '#e5e7eb',
                  borderRadius: '8px',
                  color: darkMode ? 'white' : 'black'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#82ca9d" 
                strokeWidth={3}
                dot={{ fill: '#82ca9d', r: 5 }}
                activeDot={{ r: 7 }}
                name="Accuracy (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expression (Prosody) Chart */}
        <div>
          <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
            Expression (Prosody Score)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="date" 
                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={darkMode ? '#9ca3af' : '#6b7280'} 
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                label={{ value: 'Prosody Score', angle: -90, position: 'insideLeft', style: { fill: darkMode ? '#9ca3af' : '#6b7280' } }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : 'white',
                  border: '2px solid',
                  borderColor: darkMode ? '#374151' : '#e5e7eb',
                  borderRadius: '8px',
                  color: darkMode ? 'white' : 'black'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="prosody" 
                stroke="#ffc658" 
                strokeWidth={3}
                dot={{ fill: '#ffc658', r: 5 }}
                activeDot={{ r: 7 }}
                name="Expression Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error Patterns & Struggling Words */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Common Error Patterns */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-lg`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
            <span className="text-2xl">🎯</span>
            Common Error Types
          </h3>
          
          {analytics.error_patterns && analytics.error_patterns.length > 0 ? (
            <>
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
              
              {/* Error Type List */}
              <div className="mt-4 space-y-2">
                {analytics.error_patterns.map((error, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {error.name}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {error.count} errors
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No error data available for this period
              </p>
            </div>
          )}
        </div>

        {/* Struggling Words */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6 shadow-lg`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
            <span className="text-2xl">⚠️</span>
            Most Challenging Words
          </h3>
          
          {analytics.struggling_words && analytics.struggling_words.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {analytics.struggling_words.slice(0, 15).map((item, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.02] ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                      idx < 3 
                        ? 'bg-red-500 text-white' 
                        : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-700'
                    }`}>
                      #{idx + 1}
                    </div>
                    <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.word}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all"
                        style={{ width: `${Math.min((item.error_count / item.total_occurrences) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-red-600">
                        {item.error_count} errors
                      </span>
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.total_occurrences} total
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No challenging words data available for this period
              </p>
            </div>
          )}
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
