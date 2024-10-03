// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h2>Welcome to the Company Management Dashboard</h2>
      <p>Use the links below to navigate to different sections:</p>
      <ul>
        <li><Link to="/employees">Manage Employees</Link></li>
        <li><Link to="/shifts">Manage Shifts</Link></li>
        <li><Link to="/settings">Company Settings</Link></li>
      </ul>
      <div>
        <h3>Dashboard Summary</h3>
        <p>Here you can add some summary statistics or graphs.</p>
        {/* Add summary statistics or graphs here */}
      </div>
    </div>
  );
};

export default Home;
