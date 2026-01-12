import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaFilePdf, FaFileAlt, FaSpinner, FaExternalLinkAlt, FaPlayCircle, FaFolder, FaFileWord, FaFileExcel, FaLink, FaImage } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import { materialsAPI } from '../services/api';

const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState(null);

  const decoded = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (err) {
      return null;
    }
  }, []);

  const branch = decoded?.department || decoded?.branch || null;
  const semester = decoded?.semester ?? null;

  // Initialize selected semester to current semester
  useEffect(() => {
    if (selectedSemester === null && semester !== null) {
      setSelectedSemester(semester);
    }
  }, [semester, selectedSemester]);

  useEffect(() => {
    if (selectedSemester !== null) {
      fetchStudyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, selectedSemester]);

  const fetchStudyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (branch) params.branch = branch.toLowerCase();
      if (selectedSemester !== null && selectedSemester !== undefined) params.semester = selectedSemester;

      const response = await materialsAPI.list(params);
      if (response.data?.success) {
        setMaterials(response.data.materials || []);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error('Error fetching study materials:', err);
      setError('Failed to load study materials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = materials.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      m.subject.toLowerCase().includes(term) ||
      (m.title || '').toLowerCase().includes(term) ||
      (m.description || '').toLowerCase().includes(term)
    );
    const matchesType = selectedType === 'all' || (m.type || 'document') === selectedType;
    return matchesSearch && matchesType;
  });

  const groupedBySubject = filtered.reduce((acc, mat) => {
    const key = mat.subject || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(mat);
    return acc;
  }, {});

  // Count materials by type
  const typeStats = {
    all: materials.length,
    pdf: materials.filter(m => (m.type || '').toLowerCase() === 'pdf').length,
    video: materials.filter(m => (m.type || '').toLowerCase() === 'video').length,
    document: materials.filter(m => (m.type || '').toLowerCase() === 'document').length,
    presentation: materials.filter(m => (m.type || '').toLowerCase() === 'presentation').length,
    link: materials.filter(m => (m.type || '').toLowerCase() === 'link').length,
  };

  // Count materials by semester
  const semesterStats = {};
  materials.forEach(m => {
    const sem = m.semester || 1;
    semesterStats[sem] = (semesterStats[sem] || 0) + 1;
  });

  const getFileIcon = (url = '', type = '') => {
    const urlLower = (url || '').toLowerCase();
    const typeLower = (type || '').toLowerCase();
    
    if (typeLower === 'pdf' || urlLower.includes('.pdf')) {
      return <FaFilePdf className="text-red-500 text-lg" />;
    }
    if (typeLower === 'video' || urlLower.includes('.mp4') || urlLower.includes('youtube') || urlLower.includes('vimeo')) {
      return <FaPlayCircle className="text-blue-500 text-lg" />;
    }
    if (typeLower === 'presentation' || urlLower.includes('.ppt') || urlLower.includes('.pptx')) {
      return <FaFileWord className="text-orange-500 text-lg" />;
    }
    if (typeLower === 'link' || urlLower.startsWith('http')) {
      return <FaLink className="text-green-500 text-lg" />;
    }
    if (urlLower.includes('.doc') || urlLower.includes('.docx')) {
      return <FaFileWord className="text-blue-400 text-lg" />;
    }
    if (urlLower.includes('.xls') || urlLower.includes('.xlsx')) {
      return <FaFileExcel className="text-green-600 text-lg" />;
    }
    if (urlLower.includes('.png') || urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
      return <FaImage className="text-purple-500 text-lg" />;
    }
    return <FaFileAlt className="text-gray-500 text-lg" />;
  };

  const getTypeColor = (type) => {
    const t = (type || 'document').toLowerCase();
    if (t === 'pdf') return 'bg-red-100 text-red-800';
    if (t === 'video') return 'bg-blue-100 text-blue-800';
    if (t === 'presentation') return 'bg-orange-100 text-orange-800';
    if (t === 'link') return 'bg-green-100 text-green-800';
    if (t === 'document') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const typeFilters = [
    { id: 'all', label: 'All', icon: FaBook, count: typeStats.all },
    { id: 'pdf', label: 'PDFs', icon: FaFilePdf, count: typeStats.pdf },
    { id: 'video', label: 'Videos', icon: FaPlayCircle, count: typeStats.video },
    { id: 'document', label: 'Documents', icon: FaFileAlt, count: typeStats.document },
    { id: 'presentation', label: 'Presentations', icon: FaFileWord, count: typeStats.presentation },
    { id: 'link', label: 'Links', icon: FaLink, count: typeStats.link },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-4xl font-bold text-white flex items-center mb-2">
              <FaBook className="mr-3" /> Study Materials Hub
            </h1>
            <p className="text-blue-100">Branch & semester filtered for you • All formats supported</p>
            {branch && (
              <p className="text-blue-100 text-sm mt-1">{branch.toUpperCase()}</p>
            )}
          </div>

          {/* Semester Selector */}
          <div className="mb-6">
            <p className="text-gray-300 text-sm font-medium mb-3">Select semester:</p>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                <motion.button
                  key={sem}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSemester(sem)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedSemester === sem
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>Sem {sem}</span>
                  {semesterStats[sem] && (
                    <span className="text-xs bg-black/20 px-2 py-1 rounded ml-1">{semesterStats[sem]}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Type Filters */}
          {materials.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-300 text-sm font-medium mb-3">Filter by type:</p>
              <div className="flex gap-2 flex-wrap">
                {typeFilters.map(filter => (
                  <motion.button
                    key={filter.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedType(filter.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedType === filter.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    } ${filter.count === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={filter.count === 0}
                  >
                    <filter.icon className="text-lg" />
                    {filter.label}
                    <span className="text-xs bg-black/20 px-2 py-1 rounded ml-1">{filter.count}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search subjects, titles, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Materials Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FaSpinner className="text-5xl text-blue-500 animate-spin mb-4" />
            <p className="text-gray-300 font-medium">Loading materials...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900 border border-red-700 rounded-lg p-6 text-center">
            <p className="text-red-200 font-medium">{error}</p>
            <button
              onClick={fetchStudyData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : materials.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow text-center py-12">
            <FaFolder className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-medium">No materials yet</p>
            <p className="text-gray-500 text-sm mt-2">Your teacher uploads will appear here by subject</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedBySubject).map(([subject, mats], idx) => {
              // Group materials by type within subject
              const groupedByType = mats.reduce((acc, mat) => {
                const type = (mat.type || 'document').toLowerCase();
                if (!acc[type]) acc[type] = [];
                acc[type].push(mat);
                return acc;
              }, {});

              return (
                <motion.div
                  key={subject}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700"
                >
                  <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-2">{subject}</h2>
                    <p className="text-gray-400 text-sm">{mats.length} material{mats.length === 1 ? '' : 's'}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {Object.entries(groupedByType).map(([type, items]) => (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-lg font-semibold text-gray-100 capitalize">{type}s</h3>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${getTypeColor(type)}`}>
                            {items.length}
                          </span>
                        </div>
                        <div className="space-y-3 ml-2">
                          {items.map((material, mIdx) => (
                            <motion.a
                              key={material._id || mIdx}
                              href={material.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ x: 4 }}
                              className="group flex items-start gap-4 bg-gray-700 hover:bg-gray-650 rounded-lg p-4 transition-colors border border-gray-600 cursor-pointer"
                            >
                              <div className="flex-shrink-0 mt-1">
                                {getFileIcon(material.fileUrl, material.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-100 font-medium group-hover:text-blue-400 transition-colors break-words">
                                  {material.title}
                                </p>
                                {material.description && (
                                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                    {material.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>By {material.teacherName || 'Teacher'}</span>
                                  <span>•</span>
                                  <span>{new Date(material.publishedAt || material.createdAt).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span className="text-xs px-2 py-1 rounded bg-gray-600 text-gray-200 capitalize">{material.type || 'document'}</span>
                                </div>
                              </div>
                              <FaExternalLinkAlt className="text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                            </motion.a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
