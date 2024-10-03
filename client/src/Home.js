import React from 'react';
import { Link } from 'react-router-dom';
import SignIn from './components/SignIn';  // Ensure correct import of SignIn
import './Home.css';  // For styling

const Home = () => {
  return (
    <div className="home-container">
      <SignIn />  {/* SignIn component */}
    </div>
  );
};

export default Home;
