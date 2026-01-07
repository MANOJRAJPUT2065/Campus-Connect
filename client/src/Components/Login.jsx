//           <span className="label-text text-black">USN</span>
//         </label>
//         <input type="text" placeholder="eg. 1si21csxxx" className="input input-bordered border-black" required value={usn} onChange={handleUsnChange} />
//       </div>
//       <div className="form-control">
//         <label className="label">
//           <span className="label-text text-black">Password</span>
//         </label>
//         <input type="password" placeholder="********" className="input input-bordered border-black" required value={password} onChange={handlePasswordChange} />
//       </div>
//       <div className="form-control mt-4">
//         <button type="submit" className="btn btn-success">Login</button>
//       </div>
//     </form>
//   );
// };

// export default Login;



import { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
  const [role, setRole] = useState('student'); // student, teacher, coordinator
  const [email, setEmail] = useState('');
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Role-specific validation
    if (role === 'student') {
      if (!usn || !password) {
        toast.error('Please fill in USN and Password');
        return;
      }
    } else if (role === 'coordinator') {
      // Coordinator can use either USN or Email
      if ((!usn && !email) || !password) {
        toast.error('Please fill in USN/Email and Password');
        return;
      }
    } else {
      // Teacher - Email only
      if (!email || !password) {
        toast.error('Please fill in Email and Password');
        return;
      }
    }

    try {
      setIsLoading(true);
      
      // Build login data based on role
      let loginData;
      if (role === 'student') {
        loginData = { usn, password, role };
      } else if (role === 'coordinator') {
        // Coordinator: use USN if available, otherwise email
        loginData = usn ? { usn, password, role } : { email, password, role };
      } else {
        // Teacher
        loginData = { email, password, role };
      }
      
      const response = await authAPI.login(loginData);
      
      // Store the token and role
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role);
      
      // Get user details
      const userResponse = await authAPI.getUserDetails();
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} login successful!`);
      
      // Redirect to home page
      navigate('/');
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-xl">
        <div>
          <h1 className="text-center text-4xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-center text-sm text-gray-600">Login to your account</p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { id: 'student', label: 'Student', icon: '👨‍🎓' },
            { id: 'teacher', label: 'Teacher', icon: '👨‍🏫' },
            { id: 'coordinator', label: 'Coordinator', icon: '👔' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setRole(r.id);
                setEmail('');
                setUsn('');
              }}
              className={`py-3 px-2 rounded-lg font-medium transition-all ${
                role === r.id
                  ? 'bg-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">{r.icon}</div>
              <div className="text-xs sm:text-sm">{r.label}</div>
            </button>
          ))}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-lg space-y-4 bg-gray-50 p-4">
            {/* Student: USN login */}
            {role === 'student' && (
              <div>
                <label htmlFor="usn" className="block text-sm font-medium text-gray-700 mb-1">
                  USN / Roll Number
                </label>
                <input
                  id="usn"
                  name="usn"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your USN (e.g., 1SI21CS001)"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value)}
                />
              </div>
            )}

            {/* Coordinator: USN or Email login */}
            {role === 'coordinator' && (
              <>
                <div>
                  <label htmlFor="usn" className="block text-sm font-medium text-gray-700 mb-1">
                    USN / Roll Number (Optional)
                  </label>
                  <input
                    id="usn"
                    name="usn"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your USN if available"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address {!usn && '*'}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required={!usn}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your email (if no USN)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Use either USN or Email to login</p>
                </div>
              </>
            )}

            {/* Teacher: Email login */}
            {role === 'teacher' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <button
            onClick={() => navigate('/signup')}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;