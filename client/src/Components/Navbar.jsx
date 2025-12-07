import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaUser, FaSignOutAlt, FaBell, FaSearch, FaBars, FaTimes, 
  FaHome, FaCalendarAlt, FaVideo, FaRobot, FaCode, 
  FaGraduationCap, FaChevronDown, FaComments, FaBook, FaBookmark
} from 'react-icons/fa';
import { buildApiUrl } from '../config/api';
import axios from 'axios';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const moreMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUser(null);
          return;
        }

        const response = await axios.get(buildApiUrl('/api/users/auth/getUserDetails'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user details:', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    };

    fetchUserDetails();
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setShowMoreMenu(false);
    setShowUserMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-black/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">Campus Connect</span>
            </Link>

            {/* Main Navigation - Desktop */}
            <div className="hidden lg:flex items-center space-x-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/') 
                    ? 'text-white bg-white/10' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FaHome className="inline mr-2" />
                Home
              </Link>
              <Link 
                to="/events" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/events') 
                    ? 'text-white bg-white/10' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FaCalendarAlt className="inline mr-2" />
                Events
              </Link>
              <Link 
                to="/notices" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/notices') 
                    ? 'text-white bg-white/10' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FaBookmark className="inline mr-2" />
                Notices
              </Link>
              <Link 
                to="/online-classes" 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/online-classes') 
                    ? 'text-white bg-white/10' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FaVideo className="inline mr-2" />
                Classes
              </Link>
              
              {/* More Menu */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(!showMoreMenu);
                    setShowUserMenu(false);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center ${
                    showMoreMenu
                      ? 'text-white bg-white/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  More
                  <FaChevronDown className={`ml-1 text-xs transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showMoreMenu && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-xl border border-gray-800 py-2 z-50">
                    <Link
                      to="/ai-chatbot"
                      onClick={() => setShowMoreMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FaRobot className="inline mr-2" />
                      AI Chatbot
                    </Link>
                    <Link
                      to="/study-materials"
                      onClick={() => setShowMoreMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FaBook className="inline mr-2" />
                      Study Materials
                    </Link>
                    <Link
                      to="/quiz"
                      onClick={() => setShowMoreMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FaGraduationCap className="inline mr-2" />
                      Quiz Platform
                    </Link>
                    <Link
                      to="/code-editor"
                      onClick={() => setShowMoreMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FaCode className="inline mr-2" />
                      Code Editor
                    </Link>
                    <Link
                      to="/chat"
                      onClick={() => setShowMoreMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FaComments className="inline mr-2" />
                      Chat System
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Search & User */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - Desktop */}
            <div className="hidden md:flex">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 pl-10 pr-4 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </form>
            </div>

            {/* Notifications */}
            <Link 
              to="/notifications" 
              className="hidden md:block p-2 text-gray-300 hover:text-white transition-colors relative"
            >
              <FaBell className="text-xl" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-300 hover:text-white focus:outline-none"
              >
                {isMenuOpen ? (
                  <FaTimes className="h-6 w-6" />
                ) : (
                  <FaBars className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* User Menu - Desktop */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {user.profilePicUrl ? (
                    <img 
                      src={user.profilePicUrl} 
                      alt="avatar" 
                      className="w-8 h-8 rounded-md object-cover border-2 border-white/20" 
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                      <FaUser className="text-white text-sm" />
                    </div>
                  )}
                  <FaChevronDown className={`text-gray-400 text-xs transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-xl border border-gray-800 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-sm font-medium text-white">{user.username}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      to={`/account/${encodeURIComponent(user.email)}`}
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FaUser className="inline mr-2" />
                      Profile
                    </Link>
                    <div className="border-t border-gray-800 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <FaSignOutAlt className="inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white hover:text-gray-200 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-gray-900/95 backdrop-blur-sm">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="px-4 py-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <Link
              to="/"
              onClick={toggleMobileMenu}
              className={`block px-4 py-2 text-base font-medium ${
                isActive('/') ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } rounded-md`}
            >
              <FaHome className="inline mr-2" />
              Home
            </Link>
            <Link
              to="/events"
              onClick={toggleMobileMenu}
              className={`block px-4 py-2 text-base font-medium ${
                isActive('/events') ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } rounded-md`}
            >
              <FaCalendarAlt className="inline mr-2" />
              Events
            </Link>
            <Link
              to="/notices"
              onClick={toggleMobileMenu}
              className={`block px-4 py-2 text-base font-medium ${
                isActive('/notices') ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } rounded-md`}
            >
              <FaBookmark className="inline mr-2" />
              Notices
            </Link>
            <Link
              to="/online-classes"
              onClick={toggleMobileMenu}
              className={`block px-4 py-2 text-base font-medium ${
                isActive('/online-classes') ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } rounded-md`}
            >
              <FaVideo className="inline mr-2" />
              Online Classes
            </Link>
            <Link
              to="/study-materials"
              onClick={toggleMobileMenu}
              className={`block px-4 py-2 text-base font-medium ${
                isActive('/study-materials') ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } rounded-md`}
            >
              <FaBook className="inline mr-2" />
              Study Materials
            </Link>
            <Link
              to="/ai-chatbot"
              onClick={toggleMobileMenu}
              className={`block px-4 py-2 text-base font-medium ${
                isActive('/ai-chatbot') ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } rounded-md`}
            >
              <FaRobot className="inline mr-2" />
              AI Chatbot
            </Link>
            <Link
              to="/quiz"
              onClick={toggleMobileMenu}
              className={`block px-4 py-2 text-base font-medium ${
                isActive('/quiz') ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } rounded-md`}
            >
              <FaGraduationCap className="inline mr-2" />
              Quiz Platform
            </Link>
            <Link
              to="/code-editor"
              onClick={toggleMobileMenu}
              className={`block px-4 py-2 text-base font-medium ${
                isActive('/code-editor') ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } rounded-md`}
            >
              <FaCode className="inline mr-2" />
              Code Editor
            </Link>
            <Link
              to="/chat"
              onClick={toggleMobileMenu}
              className={`block px-4 py-2 text-base font-medium ${
                isActive('/chat') ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5 hover:text-white'
              } rounded-md`}
            >
              <FaComments className="inline mr-2" />
              Chat System
            </Link>

            {/* Mobile User Menu */}
            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-800">
                <div className="flex items-center px-4">
                  {user.profilePicUrl ? (
                    <img 
                      src={user.profilePicUrl} 
                      alt="avatar" 
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/20" 
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white" />
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user.username}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to={`/account/${encodeURIComponent(user.email)}`}
                    onClick={toggleMobileMenu}
                    className="block px-4 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-md"
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMobileMenu();
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-md"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-800">
                <div className="flex space-x-3 px-4">
                  <Link
                    to="/login"
                    onClick={toggleMobileMenu}
                    className="w-full px-4 py-2 text-center text-sm font-medium text-white hover:text-gray-200 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={toggleMobileMenu}
                    className="w-full px-4 py-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;