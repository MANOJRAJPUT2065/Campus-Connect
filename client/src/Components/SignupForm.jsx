import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/api';
import { buildApiUrl } from '../config/api';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usn, setUsn] = useState('');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleUsnChange = (e) => {
    setUsn(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authAPI.signup({
        username,
        usn: usn.toUpperCase(),
        email,
        password,
      });
      
      if (response && response.data) {
        toast.success('Signup successful! Please login with your credentials.');
        navigate('/login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Signup failed. Please try again.';
      toast.error(errorMessage);
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="card-body gap-2" onSubmit={handleSubmit}>
      <div className="form-control">
        <input type="text" placeholder="Username" className="input input-bordered border-black" required value={username} onChange={handleUsernameChange} />
      </div>
      <div className="form-control">
        <input type="text" placeholder="USN (eg. 1si21csxxx)" className="input input-bordered border-black" required value={usn} onChange={handleUsnChange} />
      </div>
      <div className="form-control">
        <input type="text" placeholder="Email" className="input input-bordered border-black" required value={email} onChange={handleEmailChange} />
      </div>
      <div className="form-control">
        <input type="password" placeholder="Password" className="input input-bordered border-black" required value={password} onChange={handlePasswordChange} />
      </div>
      <div className="form-control mt-4">
        <button type="submit" className="btn btn-success">Submit</button>
      </div>
    </form>
  );
};

export default SignupForm;