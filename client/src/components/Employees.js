import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/Employees.css'; // Import the CSS file

const Employees = () => {
    const [employees, setEmployees] = useState([]);

    // Fetch the employees when the component mounts
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const token = localStorage.getItem('token'); // Retrieve the token from local storage
                const response = await axios.get('http://localhost:8383/employees', {
                    headers: {
                        'Authorization': `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                setEmployees(response.data); // Set the fetched employees data to the state
            } catch (error) {
                console.error('Error fetching employees:', error);
            }
        };

        fetchEmployees();
    }, []);

    return (
        <div className="employees-container">
            <h1>Employees Page</h1>
            <table className="employees-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Skill 1</th>
                        <th>Skill 2</th>
                        <th>Skill 3</th>
                        <th>Shifts Wanted</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.length > 0 ? (
                        employees.map((employee) => (
                            <tr key={employee.id}>
                                <td>{employee.id}</td>
                                <td>{employee.name}</td>
                                <td>{employee.skill1}</td>
                                <td>{employee.skill2}</td>
                                <td>{employee.skill3}</td>
                                <td>{employee.shifts_wanted}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="no-data">No employees found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Employees;
