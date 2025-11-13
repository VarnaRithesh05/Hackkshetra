import React, { useState, useMemo } from 'react';

const StudentTable = ({ students, onStudentClick, darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get reading level based on metrics
  const getReadingLevel = (wcpm, accuracy) => {
    if (wcpm >= 100 && accuracy >= 95) return { level: 'Independent', color: 'green' };
    if (wcpm >= 60 && accuracy >= 85) return { level: 'Instructional', color: 'blue' };
    return { level: 'Intervention', color: 'red' };
  };

  // Sort students
  const sortedStudents = useMemo(() => {
    let sortableStudents = [...students];
    if (sortConfig.key) {
      sortableStudents.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'level') {
          const levels = { 'Independent': 3, 'Instructional': 2, 'Intervention': 1 };
          aValue = levels[a.level];
          bValue = levels[b.level];
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableStudents;
  }, [students, sortConfig]);

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    return sortedStudents.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentId && student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sortedStudents, searchTerm]);

  // Paginate
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <span className="ml-1 text-gray-400">⇅</span>;
    }
    return <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800/90 border-purple-600' : 'bg-white/80 border-purple-200'} backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 transition-colors`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-3xl font-black ${darkMode ? 'text-purple-400' : 'text-purple-700'} mb-2 flex items-center transition-colors`}>
          <span className="text-4xl mr-3">👥</span>
          All Students
        </h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Click on any student to view detailed performance analytics
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search by name or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full px-4 py-3 pl-10 rounded-xl border-2 font-semibold transition-all ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
            } focus:outline-none focus:ring-2 focus:ring-purple-300`}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl">🔍</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
        <table className="w-full">
          <thead className={`${darkMode ? 'bg-gradient-to-r from-purple-900 to-indigo-900' : 'bg-gradient-to-r from-purple-100 to-indigo-100'}`}>
            <tr>
              <th 
                className="px-6 py-4 text-left cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center font-black text-sm uppercase tracking-wide">
                  Student Name <SortIcon columnKey="name" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => handleSort('lastTestDate')}
              >
                <div className="flex items-center font-black text-sm uppercase tracking-wide">
                  Last Test <SortIcon columnKey="lastTestDate" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-center cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => handleSort('wcpm')}
              >
                <div className="flex items-center justify-center font-black text-sm uppercase tracking-wide">
                  WCPM <SortIcon columnKey="wcpm" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-center cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => handleSort('accuracy')}
              >
                <div className="flex items-center justify-center font-black text-sm uppercase tracking-wide">
                  Accuracy <SortIcon columnKey="accuracy" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-center cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => handleSort('prosody')}
              >
                <div className="flex items-center justify-center font-black text-sm uppercase tracking-wide">
                  Prosody <SortIcon columnKey="prosody" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-center cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => handleSort('level')}
              >
                <div className="flex items-center justify-center font-black text-sm uppercase tracking-wide">
                  Level <SortIcon columnKey="level" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="text-6xl mb-3">🔍</div>
                  <p className={`font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {searchTerm ? 'No students found' : 'No students yet'}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {searchTerm ? 'Try a different search term' : 'Record a student assessment to get started'}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student, idx) => {
                const levelInfo = getReadingLevel(student.wcpm, student.accuracy);
                return (
                  <tr
                    key={student.studentId || idx}
                    onClick={() => onStudentClick(student)}
                    className={`border-b cursor-pointer transition-all ${
                      darkMode 
                        ? 'border-gray-700 hover:bg-gray-700/50' 
                        : 'border-gray-200 hover:bg-purple-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${
                          darkMode ? 'bg-purple-700 text-white' : 'bg-purple-200 text-purple-900'
                        }`}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {student.name}
                          </p>
                          {student.studentId && (
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              ID: {student.studentId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="text-sm font-medium">
                        {new Date(student.lastTestDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {Math.round(student.wcpm)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-900'
                      }`}>
                        {Math.round(student.accuracy)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-900'
                      }`}>
                        {student.prosody}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        levelInfo.color === 'green' ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-200 text-green-900') :
                        levelInfo.color === 'blue' ? (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-200 text-blue-900') :
                        (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-200 text-red-900')
                      }`}>
                        {levelInfo.level}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                currentPage === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : darkMode
                  ? 'bg-purple-700 text-white hover:bg-purple-600'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              ← Previous
            </button>
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    currentPage === i + 1
                      ? 'bg-purple-600 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : darkMode
                  ? 'bg-purple-700 text-white hover:bg-purple-600'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTable;
