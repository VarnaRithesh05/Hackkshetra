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
    <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
      <button onClick={handleClose} className="absolute -top-3 -right-3 bg-white rounded-full shadow-lg p-2">✕</button>
      <h3 className="text-xl font-bold mb-3">Teacher Profile</h3>
      <div className="mb-3">
        <label className="text-sm font-semibold">Email</label>
        <div className="text-sm text-gray-700 mt-1">{user.email}</div>
      </div>
      <div className="mb-3">
        <label className="text-sm font-semibold">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded" />
      </div>
      <div className="flex justify-end space-x-2 mb-4">
        <button onClick={handleSave} className="px-4 py-2 bg-gray-100 rounded">{loading ? 'Saving...' : 'Save'}</button>
      </div>

      <hr className="my-3" />
      <h4 className="font-bold mb-2">Change Password</h4>
      <div className="mb-2">
        <input type="password" placeholder="Current password" value={oldPw} onChange={e => setOldPw(e.target.value)} className="w-full px-3 py-2 border rounded mb-2" />
        <input type="password" placeholder="New password" value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full px-3 py-2 border rounded" />
      </div>
      <div className="flex justify-end space-x-2">
        <button onClick={handleChangePassword} className="px-4 py-2 bg-pink-500 text-white rounded">Change Password</button>
      </div>

      {msg && <div className="mt-3 text-sm font-bold text-gray-700">{msg}</div>}
    </div>
  );
}
