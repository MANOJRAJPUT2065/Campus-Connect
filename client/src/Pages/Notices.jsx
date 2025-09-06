import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, FileText, AlertCircle, CheckCircle, Info, Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import axios from 'axios';
import API_URL from '../api.js';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNotice, setExpandedNotice] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Sample notices data (replace with actual API call)
  const sampleNotices = [
    {
      id: 1,
      title: "Mid-Term Examination Schedule Released",
      content: "The mid-term examinations for all undergraduate programs will commence from March 15, 2024. Please check your respective department notice boards for detailed schedules. Students are advised to prepare accordingly and report any clashes immediately.",
      category: "academic",
      priority: "high",
      date: "2024-03-01",
      author: "Academic Office",
      attachments: ["exam_schedule.pdf", "guidelines.pdf"]
    },
    {
      id: 2,
      title: "Annual Tech Fest Registration Open",
      content: "TechNova 2024 - our annual technical festival is now open for registrations. Events include coding competitions, robotics challenges, hackathons, and technical workshops. Last date for registration: March 20, 2024.",
      category: "event",
      priority: "medium",
      date: "2024-03-02",
      author: "Tech Club",
      attachments: ["event_brochure.pdf"]
    },
    {
      id: 3,
      title: "Library Timings Change Notice",
      content: "Please note that the central library will now operate from 8:00 AM to 10:00 PM effective immediately. The extended hours are to accommodate students during the examination period.",
      category: "general",
      priority: "low",
      date: "2024-03-03",
      author: "Library Administration",
      attachments: []
    },
    {
      id: 4,
      title: "Campus Maintenance Work",
      content: "There will be maintenance work in the main academic block from March 5-7, 2024. Students are requested to use alternate routes and cooperate with the maintenance staff.",
      category: "urgent",
      priority: "high",
      date: "2024-03-04",
      author: "Admin Department",
      attachments: ["maintenance_schedule.pdf"]
    },
    {
      id: 5,
      title: "Internship Opportunity - Tech Giants",
      content: "Multiple internship opportunities are available with leading tech companies. Interested students should submit their resumes to the placement cell by March 10, 2024. Eligibility: 3rd and 4th year students with CGPA > 7.5.",
      category: "academic",
      priority: "medium",
      date: "2024-03-05",
      author: "Placement Cell",
      attachments: ["company_list.pdf", "application_form.pdf"]
    }
  ];

  const categories = [
    { id: 'all', name: 'All Notices', icon: Bell, count: notices.length },
    { id: 'academic', name: 'Academic', icon: FileText, count: notices.filter(n => n.category === 'academic').length },
    { id: 'event', name: 'Events', icon: Calendar, count: notices.filter(n => n.category === 'event').length },
    { id: 'urgent', name: 'Urgent', icon: AlertCircle, count: notices.filter(n => n.category === 'urgent').length },
    { id: 'general', name: 'General', icon: Info, count: notices.filter(n => n.category === 'general').length }
  ];

  useEffect(() => {
    // Fetch random daily notices from API
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      // Fetch random daily notices (8 notices per day)
      const response = await axios.get(`${API_URL}/api/notices/random?count=8`);
      if (response.data.success) {
        setNotices(response.data.notices);
      } else {
        // Fallback to sample data if API fails
        setNotices(sampleNotices);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notices:', error);
      // Fallback to sample data if API fails
      setNotices(sampleNotices);
      setLoading(false);
    }
  };

  const filteredNotices = notices.filter(notice => {
    const matchesCategory = selectedCategory === 'all' || notice.category === selectedCategory;
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notice.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-700',
          icon: AlertCircle,
          badge: 'bg-red-100 text-red-800'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-700',
          icon: Clock,
          badge: 'bg-yellow-100 text-yellow-800'
        };
      case 'low':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-700',
          icon: CheckCircle,
          badge: 'bg-green-100 text-green-800'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-700',
          icon: Info,
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getCategoryStyles = (category) => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const toggleExpand = (id) => {
    setExpandedNotice(expandedNotice === id ? null : id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Notices</h1>
              <p className="text-gray-600">Stay updated with the latest announcements and important information</p>
              <p className="text-sm text-green-600 font-medium">✨ New random notices every day! Click refresh to get more.</p>
            </div>
            <button
              onClick={fetchNotices}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Get New Random Notices"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Notices</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {category.name}
                      <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notices Grid */}
        <div className="grid gap-4">
          {filteredNotices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const priorityStyles = getPriorityStyles(notice.priority);
              const PriorityIcon = priorityStyles.icon;
              
              return (
                <div
                  key={notice.id}
                  className={`bg-white rounded-lg shadow-sm border-l-4 transition-all hover:shadow-md ${priorityStyles.bg}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${priorityStyles.badge}`}>
                          <PriorityIcon className={`w-5 h-5 ${priorityStyles.text}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryStyles(notice.category)}`}>
                              {notice.category}
                            </span>
                            <span className="text-sm text-gray-500">by {notice.author}</span>
                            <span className="text-sm text-gray-500">• {formatDate(notice.date)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleExpand(notice.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedNotice === notice.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className={`transition-all duration-200 ${expandedNotice === notice.id ? 'max-h-none' : 'max-h-20 overflow-hidden'}`}>
                      <p className="text-gray-700 leading-relaxed">{notice.content}</p>
                      
                      {notice.attachments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments:</h4>
                          <div className="flex flex-wrap gap-2">
                            {notice.attachments.map((attachment, index) => (
                              <a
                                key={index}
                                href="#"
                                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                              >
                                <FileText className="w-4 h-4" />
                                {attachment}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!expandedNotice === notice.id && notice.content.length > 100 && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleExpand(notice.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Read more
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredNotices.length} of {notices.length} notices</span>
            <span>Last updated: {formatDate(new Date().toISOString())}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notices;
