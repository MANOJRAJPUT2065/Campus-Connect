import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGraduationCap, FaChalkboardTeacher, FaUsers, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';
import axios from 'axios';

const HomePage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    usn: '',
    email: '',
    password: '',
    department: '',
    semester: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(
        buildApiUrl('/api/auth/login'),
        {
          usn: formData.usn,
          password: formData.password
        }
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.role);
        toast.success('Login successful!');
        
        // Redirect based on role
        switch (response.data.role) {
          case 'teacher':
            navigate('/teacher-dashboard');
            break;
          case 'coordinator':
            navigate('/coordinator-dashboard');
            break;
          case 'student':
            navigate('/feed');
            break;
          default:
            navigate('/feed');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const { username, usn, email, password, department, semester } = formData;
    if (!username.trim() || !usn.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    if (role === 'student' && !semester) {
      toast.error('Semester is required for students');
      return;
    }

    if (role !== 'student' && !department.trim()) {
      toast.error('Department is required for teachers/coordinators');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        buildApiUrl('/api/auth/signup'),
        {
          username: username.trim(),
          usn: usn.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
          department: department.trim(),
          semester: role === 'student' ? parseInt(semester) : undefined
        }
      );

      if (response.data.message) {
        toast.success('Account created! Please login.');
        setIsLogin(true);
        setFormData({ username: '', usn: '', email: '', password: '', department: '', semester: '' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl w-full">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-center items-start text-white"
        >
          <h1 className="text-5xl font-bold mb-6">Campus Connect</h1>
          <p className="text-xl mb-8 text-blue-100">
            Bridging the gap between teachers, coordinators, and students for seamless academic collaboration.
          </p>
          
          <div className="space-y-6 w-full">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <FaChalkboardTeacher className="text-3xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">For Teachers</h3>
                <p className="text-blue-100">Create and manage online classes with ease</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <FaUsers className="text-3xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">For Coordinators</h3>
                <p className="text-blue-100">Organize clubs and manage events effectively</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <FaGraduationCap className="text-3xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">For Students</h3>
                <p className="text-blue-100">Join classes and participate in club activities</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10"
        >
          {/* Role Selection */}
          {!isLogin && (
            <div className="mb-8">
              <p className="text-gray-700 font-semibold mb-4">Select Your Role</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'student', label: 'Student', icon: FaGraduationCap },
                  { value: 'teacher', label: 'Teacher', icon: FaChalkboardTeacher },
                  { value: 'coordinator', label: 'Coordinator', icon: FaUsers }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setRole(value)}
                    className={`p-4 rounded-lg flex flex-col items-center justify-center transition-all ${
                      role === value
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="text-2xl mb-2" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mb-8">
            {isLogin ? 'Login to your account' : `Sign up as a ${role}`}
          </p>

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-6">
            {/* Login Form */}
            {isLogin ? (
              <>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">USN / Roll Number</label>
                  <input
                    type="text"
                    name="usn"
                    value={formData.usn}
                    onChange={handleInputChange}
                    placeholder="Enter your USN"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Signup Form */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">USN / Roll Number</label>
                  <input
                    type="text"
                    name="usn"
                    value={formData.usn}
                    onChange={handleInputChange}
                    placeholder="Enter your USN"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {role === 'student' && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Semester</label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ username: '', usn: '', email: '', password: '', department: '', semester: '' });
                }}
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
