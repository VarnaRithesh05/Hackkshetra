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
    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-3">Teacher Sign In</h3>
      {error && <div className="text-red-600 font-medium mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-semibold">Email</label>
          <input className="w-full px-3 py-2 border rounded-lg" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <div>
          <label className="text-xs font-semibold">Password</label>
          <input className="w-full px-3 py-2 border rounded-lg" value={password} onChange={e => setPassword(e.target.value)} type="password" />
        </div>
        <div className="flex items-center justify-between">
          <button disabled={loading} className="bg-pink-500 text-white px-4 py-2 rounded-lg font-bold">{loading ? 'Signing in...' : 'Sign in'}</button>
          <button type="button" onClick={() => onSwitch && onSwitch('forgot')} className="text-sm text-pink-600 font-semibold underline">Forgot?</button>
        </div>
      </form>
      <div className="mt-4 text-sm">
        Don't have an account? <button onClick={() => onSwitch && onSwitch('signup')} className="text-pink-600 font-bold underline">Sign up</button>
      </div>
    </div>
  );
}
