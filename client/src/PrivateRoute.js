import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token'); // Check if the token is available in local storage
    return token ? children : <Navigate to="/" />; // If the token exists, allow access, otherwise redirect to the home page
};

export default PrivateRoute;
