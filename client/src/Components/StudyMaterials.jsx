import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaFilePdf, FaFileAlt, FaSpinner, FaExternalLinkAlt, FaPlayCircle, FaFolder } from 'react-icons/fa';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

const StudyMaterials = () => {
  const [studyData, setStudyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('Computer Related');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudyData();
  }, []);

  const fetchStudyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from Notes.json via backend
      const response = await axios.get(buildApiUrl('/api/notes'));
      
      if (Array.isArray(response.data)) {
        setStudyData(response.data);
      } else {
        setError('Invalid data format');
      }
    } catch (error) {
      console.error('Error fetching study materials:', error);
      setError('Failed to load study materials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get current branch data
  const currentBranchData = studyData.find(b => b.branch === selectedBranch);
  const branches = studyData.map(b => b.branch);

  // Filter subjects based on search
  const filteredSubjects = currentBranchData?.subjects?.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subject.category && subject.category.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const getFileIcon = (url = '') => {
    const urlLower = (url || '').toLowerCase();
    if (urlLower.includes('.pdf')) {
      return <FaFilePdf className="text-red-500 text-lg" />;
    }
    return <FaFileAlt className="text-gray-500 text-lg" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-4xl font-bold text-white flex items-center mb-2">
              <FaBook className="mr-3" /> Study Materials Hub
            </h1>
            <p className="text-blue-100">Access comprehensive learning resources by branch and subject</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Branch Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {branches.map(branch => (
              <motion.button
                key={branch}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedBranch(branch);
                  setSearchTerm('');
                }}
                className={`p-4 rounded-lg font-medium transition-all ${
                  selectedBranch === branch
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 shadow'
                }`}
              >
                {branch}
              </motion.button>
            ))}
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
        ) : !currentBranchData ? (
          <div className="bg-gray-800 rounded-lg shadow text-center py-12">
            <FaFolder className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-medium">Select a branch to view materials</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="bg-gray-800 rounded-lg shadow text-center py-12">
            <FaFileAlt className="text-6xl text-gray-600 mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-medium">No subjects found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSubjects.map((subject, idx) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700"
              >
                {/* Subject Header */}
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 border-b border-gray-700">
                  <h2 className="text-2xl font-bold text-white mb-2">{subject.name}</h2>
                  {subject.category && (
                    <p className="text-gray-400 text-sm">📌 {subject.category}</p>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Videos Section */}
                  {subject.videos && subject.videos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                        <FaPlayCircle className="mr-2" /> Video Resources
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subject.videos.map((video, vIdx) => (
                          <div
                            key={vIdx}
                            className="bg-gray-700 hover:bg-gray-650 rounded-lg p-4 transition-colors border border-gray-600"
                          >
                            <p className="text-gray-200 font-medium flex items-center">
                              <FaPlayCircle className="mr-2 text-red-500" />
                              {video.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Materials Section */}
                  {subject.materials && subject.materials.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
                        <FaExternalLinkAlt className="mr-2" /> Learning Materials
                      </h3>
                      <div className="space-y-3">
                        {subject.materials.map((material, mIdx) => (
                          <motion.a
                            key={mIdx}
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ x: 4 }}
                            className="group flex items-center gap-4 bg-gray-700 hover:bg-gray-650 rounded-lg p-4 transition-colors border border-gray-600 cursor-pointer"
                          >
                            <div className="flex-shrink-0">
                              {getFileIcon(material.url)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-100 font-medium group-hover:text-blue-400 transition-colors truncate">
                                {material.title}
                              </p>
                              <p className="text-gray-500 text-xs mt-1 truncate">
                                {material.url}
                              </p>
                            </div>
                            <FaExternalLinkAlt className="text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                          </motion.a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
