import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/AssignmentsPage.css'; // Import CSS for styling

const AssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]); // State to hold assignments
    const [message, setMessage] = useState(''); // State for messages

    // Fetch assignments when the component mounts
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const token = localStorage.getItem('token'); // Retrieve the token from local storage
                const response = await axios.get('http://localhost:8383/assignments', {
                    headers: {
                        'Authorization': `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                
                setAssignments(response.data); // Set the fetched assignments data to the state
            } catch (error) {
                console.error('Error fetching assignments:', error);
                setMessage('Failed to load assignments.'); // Update message state on error
            }
        };

        fetchAssignments();
    }, []);

    return (
        <div className="assignments-container">
            <h1 className="assignments-title">Assignments Page</h1>
            {message && <p className="error-message">{message}</p>} {/* Display any messages */}
            
            <div className="table-container">
                <table className="assignments-table">
                    <thead>
                        <tr>
                            <th>Skill</th>
                            <th>Day</th>
                            <th>Time Begin</th>
                            <th>Time End</th>
                            <th>Required Employees</th>
                            <th>Emp 1</th>
                            <th>Emp 2</th>
                            <th>Emp 3</th>
                            <th>Emp 4</th>
                            <th>Emp 5</th>
                            <th>Emp 6</th>
                            <th>Emp 7</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.length >= 0 ? (
                            assignments.map((assignment, index) => {
                                // Convert require to a number and count the number of assigned employees
                                const requiredEmployees = Number(assignment.require); // Ensure it's a number
                                const assignedEmployees = [
                                    assignment.emp1, 
                                    assignment.emp2, 
                                    assignment.emp3, 
                                    assignment.emp4, 
                                    assignment.emp5, 
                                    assignment.emp6, 
                                    assignment.emp7
                                ].filter(emp => emp).length; // Count assigned employees

                                console.log(`Required Employees: ${requiredEmployees}, Assigned Employees: ${assignedEmployees}`);

                                // Check if the required employees is greater than assigned employees
                                const rowClass = requiredEmployees > assignedEmployees ? 'red-row' : '';

                                console.log(`Row should be red: ${requiredEmployees > assignedEmployees}`); // Log if row should be red

                                return (
                                    <tr key={index} className={rowClass}>
                                        <td>{assignment.skill}</td>
                                        <td>{assignment.day}</td>
                                        <td>{assignment.time_begin}</td>
                                        <td>{assignment.time_end}</td>
                                        <td>{requiredEmployees}</td>
                                        <td>{assignment.emp1 || '-'}</td> 
                                        <td>{assignment.emp2 || '-'}</td>
                                        <td>{assignment.emp3 || '-'}</td>
                                        <td>{assignment.emp4 || '-'}</td>
                                        <td>{assignment.emp5 || '-'}</td>
                                        <td>{assignment.emp6 || '-'}</td>
                                        <td>{assignment.emp7 || '-'}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="12">No assignments to display.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AssignmentsPage;
