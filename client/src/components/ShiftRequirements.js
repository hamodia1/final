import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/ShiftRequirements.css'; // Import the CSS file

const ShiftRequirements = () => {
    const [shiftRequirements, setShiftRequirements] = useState([]);

    // Fetch the shift requirements when the component mounts
    useEffect(() => {
        const fetchShiftRequirements = async () => {
            try {
                const token = localStorage.getItem('token'); // Retrieve the token from local storage
                const response = await axios.get('http://localhost:8383/shift-requirements', {
                    headers: {
                        'Authorization': `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                setShiftRequirements(response.data); // Set the fetched shift requirements data to the state
            } catch (error) {
                console.error('Error fetching shift requirements:', error);
            }
        };

        fetchShiftRequirements();
    }, []);

    return (
        <div className="requirements-container">
            <h1>Shift Requirements Page</h1>
            <table className="requirements-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Day</th>
                        <th>Skill</th>
                        <th>Time Begin</th>
                        <th>Time End</th>
                        <th>Required Employees</th>
                    </tr>
                </thead>
                <tbody>
                    {shiftRequirements.length > 0 ? (
                        shiftRequirements.map((requirement) => (
                            <tr key={requirement.id}>
                                <td>{requirement.id}</td>
                                <td>{requirement.day}</td>
                                <td>{requirement.skill}</td>
                                <td>{requirement.time_begin}</td>
                                <td>{requirement.time_end}</td>
                                <td>{requirement.require}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="no-data">No shift requirements found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ShiftRequirements;
