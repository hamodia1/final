import React, { useState } from 'react';
import { Link } from 'react-router-dom'; 
import axios from 'axios';
import './styles/CompanyHome.css'; 

const CompanyHome = () => {
  const [employeeFile, setEmployeeFile] = useState(null);
  const [shiftFile, setShiftFile] = useState(null);
  const [requireEmpFile, setRequireEmpFile] = useState(null);

  const [employeeSuccessMessage, setEmployeeSuccessMessage] = useState('');
  const [shiftSuccessMessage, setShiftSuccessMessage] = useState('');
  const [requireEmpSuccessMessage, setRequireEmpSuccessMessage] = useState('');

  // Error and general messages
  const [employeeErrorMessage, setEmployeeErrorMessage] = useState('');
  const [shiftErrorMessage, setShiftErrorMessage] = useState('');
  const [requireEmpErrorMessage, setRequireEmpErrorMessage] = useState('');
  const [generalSuccessMessage, setGeneralSuccessMessage] = useState(''); // For messages after running algorithm

  const handleFileChange = (e, setFile) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (file, endpoint, setSuccessMessage, setErrorMessage) => {
    if (!file) {
      setErrorMessage('Please select a file before uploading');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');

    try {
      await axios.post(`http://localhost:8383/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      setSuccessMessage(`${endpoint.replace('-', ' ')} file uploaded successfully`);
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error(error);
      setErrorMessage(`Failed to upload ${endpoint} file`);
    }
  };

  const runAlgorithm = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post('http://localhost:8383/optimize-schedule', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.data.message) {
        setGeneralSuccessMessage('Schedule optimized, assignments saved in the database.');
        setTimeout(() => {
          setGeneralSuccessMessage('');
        }, 5000); // Clear the message after 5 seconds
      } else {
        setGeneralSuccessMessage('Failed to run the algorithm.');
      }
    } catch (error) {
      console.error(error);
      setGeneralSuccessMessage('Error occurred while running the algorithm.');
    }
  };

  const goToCharts = async () => {
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post('http://localhost:8383/charts', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setGeneralSuccessMessage('Charts saved successfully!');
      }
    } catch (error) {
      console.error('Error sending data to the backend:', error);
      setGeneralSuccessMessage('Failed to save charts.');
    }
  };

  return (
    <div className="full-page-container">
      <div className="company-home-container">
        <h1>Welcome to the Company Home Page</h1>

        <nav className="navigation">
          <ul>
            <li><Link to="/employees">Employees</Link></li>
            <li><Link to="/shifts-types">Shifts Types</Link></li>
            <li><Link to="/shift-requirements">Shift Requirements</Link></li>
            <li><Link to="/results">Results</Link></li>
            <li><Link to="/images">Charts</Link></li>
            <li><Link to="/assignments">Assignments</Link></li>
          </ul>
        </nav>

        {/* Employees CSV Upload */}
        <div className="upload-section">
          <h3>Upload Employees CSV</h3>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileChange(e, setEmployeeFile)}
            className="file-input"
          />
          <button
            onClick={() => handleFileUpload(employeeFile, 'upload-employees', setEmployeeSuccessMessage, setEmployeeErrorMessage)}
            className="upload-button"
          >
            Upload Employees
          </button>
          {employeeSuccessMessage && <p className="success-message">{employeeSuccessMessage}</p>}
          {employeeErrorMessage && <p className="error-message">{employeeErrorMessage}</p>}
        </div>

        {/* Shifts CSV Upload */}
        <div className="upload-section">
          <h3>Upload Shifts CSV</h3>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileChange(e, setShiftFile)}
            className="file-input"
          />
          <button
            onClick={() => handleFileUpload(shiftFile, 'upload-shifts', setShiftSuccessMessage, setShiftErrorMessage)}
            className="upload-button"
          >
            Upload Shifts
          </button>
          {shiftSuccessMessage && <p className="success-message">{shiftSuccessMessage}</p>}
          {shiftErrorMessage && <p className="error-message">{shiftErrorMessage}</p>}
        </div>

        {/* Required Employees CSV Upload */}
        <div className="upload-section">
          <h3>Upload Required Employees CSV</h3>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => handleFileChange(e, setRequireEmpFile)}
            className="file-input"
          />
          <button
            onClick={() => handleFileUpload(requireEmpFile, 'upload-require-employees', setRequireEmpSuccessMessage, setRequireEmpErrorMessage)}
            className="upload-button"
          >
            Upload Required Employees
          </button>
          {requireEmpSuccessMessage && <p className="success-message">{requireEmpSuccessMessage}</p>}
          {requireEmpErrorMessage && <p className="error-message">{requireEmpErrorMessage}</p>}
        </div>

        <div className="run-section">
          <h3>Run Shift Optimization Algorithm</h3>
          <button onClick={runAlgorithm} className="run-button">Run Algorithms</button>
          <button onClick={goToCharts} className="run-button">Save Charts</button>
          {generalSuccessMessage && <p className="general-success-message">{generalSuccessMessage}</p>} {/* General success message */}
        </div>
      </div>
    </div>
  );
};

export default CompanyHome;
