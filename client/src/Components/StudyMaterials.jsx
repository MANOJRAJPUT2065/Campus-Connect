import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaDownload, FaBook, FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileExcel, FaFileAlt } from 'react-icons/fa';
import axios from 'axios';
import BASE_API from '../api';

const StudyMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('CSE');

  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  useEffect(() => {
    fetchStudyMaterials();
  }, [selectedBranch]);

  // const fetchStudyMaterials = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await axios.get(`${BASE_API}/notes/getBranchNotes/${selectedBranch}`);
  //     if (response.data && response.data.subjects) {
  //       const transformedMaterials = response.data.subjects.flatMap(subject => 
  //         subject.notes.map(note => ({
  //           id: note._id,
  //           title: note.title,
  //           type: note.type || 'PDF',
  //           subject: subject.subjectName,
  //           branch: selectedBranch,
  //           url: note.url,
  //           uploadedAt: note.uploadedAt || new Date().toISOString()
  //         }))
  //       );
  //       setMaterials(transformedMaterials);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching study materials:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };



  const fetchStudyMaterials = async () => {
  setLoading(true);

  // VTU DATA
  const VTU_DATA = {
    CSE: [
      {
        subject: "Data Structures",
        notes: [
          { title: "DS Notes PDF", url: "https://vtu.ac.in/wp-content/uploads/2022/DS.pdf", type: "pdf" },
          { title: "DS Lab Manual", url: "https://vtu.ac.in/wp-content/uploads/2022/DS-lab.pdf", type: "pdf" }
        ],
        videos: [
          { title: "DS Full Playlist - NPTEL", url: "https://www.youtube.com/playlist?list=PLLOxZwkBK52CK0aUg3SJlWSqU9xGg4j7j" },
          { title: "DS VTU Lecture Series", url: "https://www.youtube.com/playlist?list=PLwkEJj2RYeJZkDzB8pvN4dQzz8DVdhf6O" }
        ]
      },
      {
        subject: "Computer Networks",
        notes: [
          { title: "CN Notes", url: "https://vtu.ac.in/wp-content/uploads/2022/CN.pdf", type: "pdf" }
        ],
        videos: [
          { title: "CN VTU Playlist", url: "https://www.youtube.com/playlist?list=PLxCzCOWd7aiGFBD2-2joCpWOLUrDLvVV_" }
        ]
      }
    ],

    IT: [
      {
        subject: "DBMS",
        notes: [
          { title: "DBMS Notes", url: "https://vtu.ac.in/wp-content/uploads/2022/DBMS.pdf", type: "pdf" }
        ],
        videos: [
          { title: "DBMS Playlist", url: "https://www.youtube.com/playlist?list=PLEbnTDJUr_IcPtUXFy2b1sGRPsLFMghhS" }
        ]
      }
    ],

    ECE: [
      {
        subject: "Digital Electronics",
        notes: [
          { title: "DE Notes", url: "https://vtu.ac.in/wp-content/uploads/2022/DE.pdf", type: "pdf" }
        ],
        videos: [
          { title: "DE Playlist", url: "https://www.youtube.com/playlist?list=PLLOxZwkBK52B9CY7Yg2PXR4KpoC6WVW57" }
        ]
      }
    ]
  };

  const transformed = VTU_DATA[selectedBranch]?.flatMap(sub =>
    sub.notes.map(note => ({
      id: Math.random(),
      title: note.title,
      type: note.type,
      subject: sub.subject,
      branch: selectedBranch,
      url: note.url,
      uploadedAt: new Date().toISOString()
    }))
  ) || [];

  setMaterials(transformed);
  setLoading(false);
};


  const filteredMaterials = materials.filter(material => 
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type) => {
    const fileType = (type || '').toLowerCase();
    switch (fileType) {
      case 'pdf':
        return <FaFilePdf className="text-red-500 text-2xl" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-500 text-2xl" />;
      case 'ppt':
      case 'pptx':
        return <FaFilePowerpoint className="text-orange-500 text-2xl" />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-500 text-2xl" />;
      default:
        return <FaFileAlt className="text-gray-500 text-2xl" />;
    }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <FaBook className="mr-2" /> Study Materials
        </h1>
        
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <select
            className="p-2 border rounded-lg"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FaFileAlt className="mx-auto text-4xl mb-2" />
            <p>No study materials found</p>
            <p className="text-sm">Select a different branch or check back later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMaterials.map((material) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getFileIcon(material.type)}
                  <div>
                    <h3 className="font-medium">{material.title}</h3>
                    <p className="text-sm text-gray-500">
                      {material.subject} • {new Date(material.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(material.url, material.title)}
                  className="flex items-center space-x-1 text-blue-500 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50"
                  title="Download"
                >
                  <FaDownload />
                  <span className="hidden md:inline">Download</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
