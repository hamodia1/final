// src/components/Auth.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    companyName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e, formSetter, form) => {
    formSetter({ ...form, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      if (response.ok) {
        login();
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to login. Please try again.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerForm),
      });

      const data = await response.json();
      if (response.ok) {
        setIsLogin(true); // Switch to login after successful registration
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to register. Please try again.');
    }
  };

  return (
    <div>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      {isLogin ? (
        <form onSubmit={handleLoginSubmit}>
          <div>
            <label>Email:</label>
            <input type="email" name="email" value={loginForm.email} onChange={(e) => handleChange(e, setLoginForm, loginForm)} required />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" name="password" value={loginForm.password} onChange={(e) => handleChange(e, setLoginForm, loginForm)} required />
          </div>
          <button type="submit">Login</button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit}>
          <div>
            <label>Company Name:</label>
            <input type="text" name="companyName" value={registerForm.companyName} onChange={(e) => handleChange(e, setRegisterForm, registerForm)} required />
          </div>
          <div>
            <label>Email:</label>
            <input type="email" name="email" value={registerForm.email} onChange={(e) => handleChange(e, setRegisterForm, registerForm)} required />
          </div>
          <div>
            <label>Phone:</label>
            <input type="text" name="phone" value={registerForm.phone} onChange={(e) => handleChange(e, setRegisterForm, registerForm)} required />
          </div>
          <div>
            <label>Password:</label>
            <input type="password" name="password" value={registerForm.password} onChange={(e) => handleChange(e, setRegisterForm, registerForm)} required />
          </div>
          <button type="submit">Register</button>
        </form>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Don't have an account? Register here" : 'Already have an account? Login here'}
      </button>
    </div>
  );
};

export default Auth;
