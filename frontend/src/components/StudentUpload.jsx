import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const StudentUpload = ({ onUploadSuccess, onClose, darkMode, currentUser }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select an Excel file (.xlsx or .xls)');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('teacher_id', currentUser?.id || 'default_teacher');

    try {
      const response = await axios.post(`${API_URL}/students/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      setFile(null);
      
      // Call success callback after a brief delay to show results
      setTimeout(() => {
        onUploadSuccess && onUploadSuccess();
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-8 max-w-2xl w-full shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📤 Upload Student List
          </h2>
          <button
            onClick={onClose}
            className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} text-2xl font-bold transition-colors`}
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Upload an Excel file (.xlsx or .xls) with your class roster. The file should have the following columns:
          </p>
          <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 mb-4`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                  <th className={`text-left p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-bold`}>Column</th>
                  <th className={`text-left p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-bold`}>Required</th>
                  <th className={`text-left p-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-bold`}>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`p-2 ${darkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>Name</td>
                  <td className={`p-2 ${darkMode ? 'text-green-400' : 'text-green-600'} font-bold`}>Yes</td>
                  <td className={`p-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>John Smith</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`p-2 ${darkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>Grade</td>
                  <td className={`p-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} font-bold`}>Optional</td>
                  <td className={`p-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>4</td>
                </tr>
                <tr>
                  <td className={`p-2 ${darkMode ? 'text-white' : 'text-gray-900'} font-semibold`}>Student ID</td>
                  <td className={`p-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} font-bold`}>Optional</td>
                  <td className={`p-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>12345</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
            Note: The first row should contain column headers. Existing students will be updated if they have the same name.
          </p>
        </div>

        {/* File Input */}
        <div className="mb-6">
          <label className={`block mb-2 font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Select Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
            className={`w-full p-3 border-2 rounded-lg ${
              darkMode 
                ? 'bg-gray-900 border-gray-600 text-white file:bg-blue-600 file:text-white' 
                : 'bg-white border-gray-300 text-gray-900 file:bg-blue-500 file:text-white'
            } file:border-0 file:px-4 file:py-2 file:rounded-lg file:font-semibold file:mr-4 cursor-pointer transition-colors`}
          />
          {file && (
            <p className={`mt-2 text-sm ${darkMode ? 'text-green-400' : 'text-green-600'} flex items-center`}>
              <span className="mr-2">✓</span>
              Selected: {file.name}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 font-semibold">❌ {error}</p>
          </div>
        )}

        {/* Success Message */}
        {result && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-700 font-bold mb-2">✅ Upload Successful!</p>
            <ul className="text-green-600 text-sm space-y-1">
              <li>• {result.students_added} students added</li>
              <li>• {result.students_updated} students updated</li>
              <li>• {result.total} total students processed</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              !file || uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : darkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              '📤 Upload Students'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className={`px-6 py-3 border-2 rounded-lg font-bold transition-all ${
              darkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
        </div>

        {/* Download Template */}
        <div className="mt-6 pt-6 border-t border-gray-300">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Need a template? Create an Excel file with these column headers:
          </p>
          <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-100'} p-3 rounded-lg font-mono text-xs`}>
            <code className={darkMode ? 'text-green-400' : 'text-green-700'}>
              Name | Grade | Student ID
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentUpload;
