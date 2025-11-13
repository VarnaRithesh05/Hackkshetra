import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

export default function Signup({ onClose, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    if (!name || !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
  // Send name along with signup
  await axios.post(`${API_URL}/auth/signup`, { email, password, name: name.trim() });
      onClose && onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-3">Teacher Sign Up</h3>
      {error && <div className="text-red-600 font-medium mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-semibold">Email</label>
          <input className="w-full px-3 py-2 border rounded-lg" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <div>
          <label className="text-xs font-semibold">Full name</label>
          <input className="w-full px-3 py-2 border rounded-lg" value={name} onChange={e => setName(e.target.value)} type="text" />
        </div>
        <div>
          <label className="text-xs font-semibold">Password</label>
          <input className="w-full px-3 py-2 border rounded-lg" value={password} onChange={e => setPassword(e.target.value)} type="password" />
        </div>
        <div>
          <label className="text-xs font-semibold">Confirm Password</label>
          <input className="w-full px-3 py-2 border rounded-lg" value={confirm} onChange={e => setConfirm(e.target.value)} type="password" />
        </div>
        <div className="flex items-center justify-between">
          <button disabled={loading} className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold">{loading ? 'Creating...' : 'Create account'}</button>
          <button type="button" onClick={() => onSwitch && onSwitch('login')} className="text-sm text-purple-600 font-semibold underline">Sign in</button>
        </div>
      </form>
    </div>
  );
}
