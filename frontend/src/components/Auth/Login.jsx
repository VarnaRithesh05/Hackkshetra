import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

export default function Login({ onClose, onSwitch, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const resp = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (resp.data.success && resp.data.user && resp.data.token) {
        // Call parent handler to update App state
        if (onLoginSuccess) {
          onLoginSuccess(resp.data.user, resp.data.token);
        }
        // On success, close modal
        onClose && onClose();
      } else {
        setError('Login response invalid.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
      <h3 className="text-3xl font-black text-gray-900 mb-6">Teacher Sign In</h3>
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 mb-4 flex items-start space-x-2">
          <span className="text-xl">❌</span>
          <p className="text-sm text-red-800 font-semibold">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:border-gray-900 focus:outline-none transition" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            type="email" 
            placeholder="teacher@school.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
          <input 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:border-gray-900 focus:outline-none transition" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            type="password"
            placeholder="Enter your password"
          />
        </div>
        <div className="flex items-center justify-between pt-2">
          <button 
            disabled={loading} 
            className="px-8 py-3 border-2 border-gray-900 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
          <button 
            type="button" 
            onClick={() => onSwitch && onSwitch('forgot')} 
            className="text-sm text-gray-600 hover:text-gray-900 font-semibold underline transition"
          >
            Forgot?
          </button>
        </div>
      </form>
      <div className="mt-6 text-center text-sm text-gray-600">
        Don't have an account? 
        <button 
          onClick={() => onSwitch && onSwitch('signup')} 
          className="ml-1 text-gray-900 font-bold underline hover:text-gray-700 transition"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
