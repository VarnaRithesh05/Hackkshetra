import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

export default function ForgotPassword({ onClose, onSwitch }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      // Placeholder API call
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage('If this email exists, a reset link has been sent.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-3">Reset Password</h3>
      {error && <div className="text-red-600 font-medium mb-2">{error}</div>}
      {message && <div className="text-green-600 font-medium mb-2">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-semibold">Email</label>
          <input className="w-full px-3 py-2 border rounded-lg" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <div className="flex items-center justify-between">
          <button disabled={loading} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold">{loading ? 'Sending...' : 'Send reset link'}</button>
          <button type="button" onClick={() => onSwitch && onSwitch('login')} className="text-sm text-yellow-600 font-semibold underline">Back to sign in</button>
        </div>
      </form>
    </div>
  );
}
