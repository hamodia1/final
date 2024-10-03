// src/components/Login.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
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

  return (
    <div>
      <h2>התחברות</h2>
      <form onSubmit={handleSubmit}>
        <label>אימייל:</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required /><br />
        <label>סיסמה:</label>
        <input type="password" name="password" value={form.password} onChange={handleChange} required /><br />
        <button type="submit">התחברות</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <a href="/forgot-password">שכחתי סיסמה</a>
    </div>
  );
};

export default Login;
