import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaTimes, FaPlus, FaFileAlt, FaCloudUploadAlt, FaCheck, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';

const TeacherMaterialUpload = ({ onMaterialCreated, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    type: 'pdf',
    fileUrl: '',
    branch: '',
    semester: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' ? (value ? parseInt(value, 10) : '') : value
    }));
  };

  const uploadToCloudinary = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      // Create progress event
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setFormData(prev => ({
              ...prev,
              fileUrl: response.url
            }));
            toast.success('File uploaded successfully!');
          } else {
            toast.error(response.error || 'Upload failed');
          }
        } else {
          toast.error('Upload failed');
        }
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        toast.error('Failed to upload file');
        setUploading(false);
        setUploadProgress(0);
      });

      const token = localStorage.getItem('token');
      xhr.open('POST', buildApiUrl('/api/upload'));
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      uploadToCloudinary(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      uploadToCloudinary(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.subject.trim() || !formData.fileUrl.trim() || !formData.branch || !formData.semester) {
      toast.error('Title, subject, file, branch, and semester are required');
      return;
    }

    const normalizedData = {
      ...formData,
      branch: formData.branch.toLowerCase(),
      semester: parseInt(formData.semester, 10)
    };

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(buildApiUrl('/api/materials'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(normalizedData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Material uploaded successfully!');
        setFormData({
          title: '',
          subject: '',
          description: '',
          type: 'pdf',
          fileUrl: '',
          branch: '',
          semester: ''
        });
        if (onMaterialCreated) onMaterialCreated(data.material);
        if (onClose) onClose();
      } else {
        toast.error(data.error || 'Failed to upload material');
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Failed to upload material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaBook className="text-green-600" /> Upload Study Material
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Chapter 1 - Introduction to DSA"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Data Structures"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="pdf">PDF</option>
                <option value="document">Document</option>
                <option value="presentation">Presentation</option>
                <option value="video">Video</option>
                <option value="link">Link</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the material..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Drag and Drop Area or Manual URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Upload *
            </label>
            
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-green-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mov,.webm"
              />

              {uploading ? (
                <div className="space-y-2">
                  <FaSpinner className="text-4xl text-green-600 mx-auto animate-spin" />
                  <p className="text-gray-700 font-medium">Uploading... {uploadProgress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : formData.fileUrl ? (
                <div className="space-y-2">
                  <FaCheck className="text-4xl text-green-600 mx-auto" />
                  <p className="text-gray-700 font-medium">File uploaded successfully!</p>
                  <p className="text-xs text-gray-500 truncate">{formData.fileUrl.split('/').pop()}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <div
                  className="space-y-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto" />
                  <p className="text-gray-700 font-medium">Drag and drop your file here</p>
                  <p className="text-sm text-gray-500">or click to select a file</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supported: PDF, Word, PowerPoint, Excel, Video
                  </p>
                </div>
              )}
            </div>

            {/* Or Manual URL */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or paste URL</span>
              </div>
            </div>

            <input
              type="url"
              name="fileUrl"
              value={formData.fileUrl}
              onChange={handleChange}
              placeholder="https://example.com/file.pdf"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch / Department *
              </label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g., CSE, ECE"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester *
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>{`Semester ${sem}`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.fileUrl}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaPlus />
              {loading ? 'Uploading...' : 'Upload Material'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TeacherMaterialUpload;
