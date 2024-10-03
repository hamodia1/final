import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import CompanyHome from './components/CompanyHome';
import Employees from './components/Employees';
import ShiftsTypes from './components/ShiftsTypes';
import ShiftRequirements from './components/ShiftRequirements';
import Results from './components/Results';
import SignUp from './components/SignUp'; // Import the SignUp component
import PrivateRoute from './PrivateRoute';
import ImagesPage from './components/ImagesPage';
import AssignmentsPage from './components/AssignmentsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} /> {/* Add the sign-up route */}

        {/* Protecting the CompanyHome and other pages with PrivateRoute */}
        <Route
          path="/company-home"
          element={
            <PrivateRoute>
              <CompanyHome />
            </PrivateRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <PrivateRoute>
              <Employees />
            </PrivateRoute>
          }
        />
        <Route
          path="/shifts-types"
          element={
            <PrivateRoute>
              <ShiftsTypes />
            </PrivateRoute>
          }
        />
        <Route
          path="/shift-requirements"
          element={
            <PrivateRoute>
              <ShiftRequirements />
            </PrivateRoute>
          }
        />
        <Route
          path="/results"
          element={
            <PrivateRoute>
              <Results />
            </PrivateRoute>
          }
        />
        <Route
          path="/images"
          element={
            <PrivateRoute>
              <ImagesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <PrivateRoute>
              <AssignmentsPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
