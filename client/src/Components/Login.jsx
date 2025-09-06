/* eslint-disable react/prop-types */
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/api';

const Login = () => {
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleUsnChange = (e) => {
    setUsn(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(buildApiUrl('/api/users/auth/login'), { usn, password });
      
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      toast.success('Login successful');
      
      // Navigate to home page after successful login
      setTimeout(() => {
        navigate('/');
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      console.error(error);
    }
  };

  return (
    <form className="card-body gap-2" onSubmit={handleSubmit}>
      <div className="form-control">
        <label className="label">
          <span className="label-text text-black">USN</span>
        </label>
        <input type="text" placeholder="eg. 1si21csxxx" className="input input-bordered border-black" required value={usn} onChange={handleUsnChange} />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text text-black">Password</span>
        </label>
        <input type="password" placeholder="********" className="input input-bordered border-black" required value={password} onChange={handlePasswordChange} />
      </div>
      <div className="form-control mt-4">
        <button type="submit" className="btn btn-success">Login</button>
      </div>
    </form>
  );
};

export default Login;