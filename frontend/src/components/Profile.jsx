import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

export default function Profile({ user, token, onClose, onUpdateUser, onLogout }) {
  const [name, setName] = useState(user.name || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSave = async () => {
    setLoading(true);
    setMsg(null);
    try {
      // Patch user name - backend must support /api/auth/update-profile
      const resp = await axios.post(`${API_URL}/auth/update-profile`, { email: user.email, name }, { headers: { Authorization: token } });
      if (resp.data.success) {
        onUpdateUser && onUpdateUser({ ...user, name });
        setMsg('Saved');
      } else {
        setMsg('Failed to save');
      }
    } catch (err) {
      console.error(err);
      setMsg('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const handleChangePassword = async () => {
    if (!oldPw || !newPw) return setMsg('Enter both fields');
    setLoading(true);
    setMsg(null);
    try {
      const resp = await axios.post(`${API_URL}/auth/change-password`, { email: user.email, old_password: oldPw, new_password: newPw }, { headers: { Authorization: token } });
      if (resp.data.success) {
        setMsg('Password updated');
        setOldPw(''); setNewPw('');
      } else {
        setMsg(resp.data.error || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      setMsg('Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    try { window.location.hash = '#/record'; } catch(e) {}
    onClose && onClose();
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Gradient Orbs Background */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/40 to-teal-300/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-200/40 to-rose-300/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 max-w-2xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-5xl font-black text-gray-900">Teacher Profile</h1>
          <button 
            onClick={handleClose}
            className="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all flex items-center justify-center text-xl"
          >
            ✕
          </button>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm mb-6">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Personal Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-600">{user.email}</div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:border-gray-900 focus:outline-none transition" 
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="px-8 py-3 border-2 border-gray-900 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes →'}
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm mb-6">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Change Password</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
              <input 
                type="password" 
                placeholder="Enter current password" 
                value={oldPw} 
                onChange={e => setOldPw(e.target.value)} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:border-gray-900 focus:outline-none transition"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
              <input 
                type="password" 
                placeholder="Enter new password" 
                value={newPw} 
                onChange={e => setNewPw(e.target.value)} 
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:border-gray-900 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button 
              onClick={handleChangePassword}
              disabled={loading}
              className="px-8 py-3 border-2 border-gray-900 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              Update Password →
            </button>
          </div>
        </div>

        {/* Message */}
        {msg && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-start space-x-3">
            <span className="text-2xl">✅</span>
            <p className="text-sm text-green-800 font-semibold">{msg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
