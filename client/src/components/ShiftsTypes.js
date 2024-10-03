import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/ShiftsTypes.css'; // Import the CSS file

const ShiftsTypes = () => {
    const [shiftsTypes, setShiftsTypes] = useState([]);

    // Fetch the shifts types when the component mounts
    useEffect(() => {
        const fetchShiftsTypes = async () => {
            try {
                const token = localStorage.getItem('token'); // Retrieve the token from local storage
                const response = await axios.get('http://localhost:8383/shifts', {
                    headers: {
                        'Authorization': `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                setShiftsTypes(response.data); // Set the fetched shifts types data to the state
            } catch (error) {
                console.error('Error fetching shifts types:', error);
            }
        };

        fetchShiftsTypes();
    }, []);

    return (
        <div className="shifts-container">
            <h1>Shifts Types Page</h1>
            <table className="shifts-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Skill</th>
                        <th>Day</th>
                        <th>Time Begin</th>
                        <th>Time End</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {shiftsTypes.length > 0 ? (
                        shiftsTypes.map((shift) => (
                            <tr key={shift.id}>
                                <td>{shift.id}</td>
                                <td>{shift.skill}</td>
                                <td>{shift.day}</td>
                                <td>{shift.time_begin}</td>
                                <td>{shift.time_end}</td>
                                <td>{shift.price}$</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="no-data">No shifts types found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ShiftsTypes;
