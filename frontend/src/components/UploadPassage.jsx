import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

export default function UploadPassage({ onClose, onPassageAdded }) {
  const [level, setLevel] = useState('Level 1');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError('Please enter a passage title.');
      return;
    }

    if (!text.trim()) {
      setError('Please enter the passage text.');
      return;
    }

    if (text.trim().split(/\s+/).length < 10) {
      setError('Passage must contain at least 10 words.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/passages`, {
        level,
        title: title.trim(),
        text: text.trim()
      });

      if (response.data.success) {
        setSuccess(true);
        setTitle('');
        setText('');
        setLevel('Level 1');
        
        // Call callback to refresh passages list
        if (onPassageAdded) {
          onPassageAdded();
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose && onClose();
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to upload passage.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload passage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg border-2 border-purple-300 flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-black text-purple-700 flex items-center">
          <span className="text-3xl mr-2">📚</span>
          Upload Custom Passage
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto flex-1 p-6">
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-4 py-3 rounded-xl mb-4 font-bold text-sm">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-2 border-green-400 text-green-800 px-4 py-3 rounded-xl mb-4 font-bold text-sm">
            ✅ Passage uploaded successfully! Closing...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Level Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Reading Level <span className="text-red-500">*</span>
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 font-bold text-gray-800"
            >
              <option value="Level 1">Level 1 - Beginner</option>
              <option value="Level 2">Level 2 - Intermediate</option>
              <option value="Level 3">Level 3 - Advanced</option>
              <option value="Level 4">Level 4 - Expert</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Passage Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="e.g., My Amazing Adventure"
              maxLength="100"
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 font-medium"
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>

          {/* Passage Text */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Passage Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
              placeholder="Paste or type the reading passage here. Minimum 10 words required."
              rows="6"
              maxLength="5000"
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 font-medium resize-none"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Words: {text.trim().split(/\s+/).filter(w => w.length > 0).length}</span>
              <span>{text.length}/5000 characters</span>
            </div>
          </div>

          {/* Help Section */}
          <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
            <p className="text-xs font-bold text-blue-900 mb-2">💡 Tips for Best Results:</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Keep passages between 50-300 words for optimal assessment</li>
              <li>Use age-appropriate content for the reading level</li>
              <li>Include a mix of simple and complex vocabulary</li>
              <li>Passages should be clear and engaging</li>
            </ul>
          </div>
        </form>
      </div>

      {/* Footer with Buttons */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105 text-lg flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <span className="text-2xl">📤</span>
              <span>Upload Passage</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="bg-white hover:bg-gray-100 disabled:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-xl transition-colors border-2 border-gray-300 text-lg"
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  );
}
