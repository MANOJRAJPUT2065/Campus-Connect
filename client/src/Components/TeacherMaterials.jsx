import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrash, FaBook, FaFilePdf, FaFile, FaVideo, FaLink, FaFileWord, FaFileExcel, FaFilePowerpoint, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';

const TeacherMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fetch teacher's materials
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/materials/my-materials'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setMaterials(data.materials || []);
      } else {
        toast.error(data.error || 'Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      setDeleting(materialId);
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/api/materials/${materialId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setMaterials(prev => prev.filter(m => m._id !== materialId));
        toast.success('Material deleted successfully!');
      } else {
        toast.error(data.error || 'Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    } finally {
      setDeleting(null);
    }
  };

  const getFileIcon = (type, fileUrl) => {
    const ext = fileUrl?.split('.').pop()?.toLowerCase() || '';
    
    if (type === 'pdf' || ext === 'pdf') return <FaFilePdf className="text-red-500" />;
    if (type === 'video' || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return <FaVideo className="text-purple-500" />;
    if (type === 'document' || ['doc', 'docx'].includes(ext)) return <FaFileWord className="text-blue-500" />;
    if (type === 'presentation' || ['ppt', 'pptx'].includes(ext)) return <FaFilePowerpoint className="text-orange-500" />;
    if (type === 'spreadsheet' || ['xls', 'xlsx', 'csv'].includes(ext)) return <FaFileExcel className="text-green-500" />;
    if (type === 'link' || fileUrl?.startsWith('http')) return <FaLink className="text-indigo-500" />;
    return <FaFile className="text-gray-500" />;
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      pdf: 'bg-red-100 text-red-800',
      video: 'bg-purple-100 text-purple-800',
      document: 'bg-blue-100 text-blue-800',
      presentation: 'bg-orange-100 text-orange-800',
      spreadsheet: 'bg-green-100 text-green-800',
      link: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredMaterials = selectedFilter === 'all' 
    ? materials 
    : materials.filter(m => m.type === selectedFilter);

  const groupedBySubject = filteredMaterials.reduce((acc, material) => {
    if (!acc[material.subject]) {
      acc[material.subject] = [];
    }
    acc[material.subject].push(material);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaSpinner className="text-4xl text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaBook className="text-2xl text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">My Materials</h2>
        </div>
        <p className="text-sm text-gray-600">Total: {materials.length} materials</p>
      </div>

      {materials.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center"
        >
          <FaExclamationCircle className="text-4xl text-blue-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">No materials uploaded yet</p>
          <p className="text-sm text-gray-600 mt-1">Upload your first study material to get started!</p>
        </motion.div>
      ) : (
        <>
          {/* Type Filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({materials.length})
            </button>
            {['pdf', 'video', 'document', 'presentation', 'spreadsheet', 'link'].map(type => {
              const count = materials.filter(m => m.type === type).length;
              return count > 0 ? (
                <button
                  key={type}
                  onClick={() => setSelectedFilter(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedFilter === type
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                </button>
              ) : null;
            })}
          </div>

          {/* Materials by Subject */}
          <div className="space-y-6">
            {Object.entries(groupedBySubject).map(([subject, subjectMaterials]) => (
              <motion.div
                key={subject}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-green-500 pb-2">
                  {subject}
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {subjectMaterials.map(material => (
                    <motion.div
                      key={material._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 text-3xl mt-1">
                          {getFileIcon(material.type, material.fileUrl)}
                        </div>

                        {/* Content */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-grow min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {material.title}
                              </h4>
                              {material.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {material.description}
                                </p>
                              )}
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(material._id)}
                              disabled={deleting === material._id}
                              className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="Delete material"
                            >
                              {deleting === material._id ? (
                                <FaSpinner className="text-lg animate-spin" />
                              ) : (
                                <FaTrash className="text-lg" />
                              )}
                            </button>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadgeColor(material.type)}`}>
                              {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              📚 Sem {material.semester}
                            </span>
                            <span className="text-xs text-gray-500">
                              📍 {material.branch}
                            </span>
                            {material.publishedAt && (
                              <span className="text-xs text-gray-500">
                                📅 {new Date(material.publishedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherMaterials;
