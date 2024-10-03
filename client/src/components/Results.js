import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles/Results.css'; // Import the CSS file for styling

const Results = () => {
    const [results, setResults] = useState([]);
    const [totalShifts, setTotalShifts] = useState(0); // State to store the total number of shifts
    const [totalCost, setTotalCost] = useState(0); // State to store the total cost of the shifts

    // Fetch the results when the component mounts
    useEffect(() => {
        const fetchResults = async () => {
            try {
                const token = localStorage.getItem('token'); // Retrieve the token from local storage
                const response = await axios.get('http://localhost:8383/results', {
                    headers: {
                        'Authorization': `Bearer ${token}` // Include the token in the Authorization header
                    }
                });
                const resultsData = response.data;
                setResults(resultsData); // Set the fetched results data to the state

                // Calculate total shifts and total cost
                const totalShiftsCount = resultsData.length; // Number of shifts
                const totalCostCalculation = resultsData.reduce((acc, result) => {
                    const shiftCost = result.price * result.require; // Calculate cost for this shift
                    return acc + shiftCost;
                }, 0); // Initialize total cost to 0

                setTotalShifts(totalShiftsCount); // Set total shifts count
                setTotalCost(totalCostCalculation); // Set total cost
            } catch (error) {
                console.error('Error fetching results:', error);
            }
        };

        fetchResults();
    }, []);

    return (
        <div className="results-container">
            <h1>Results Page</h1>

            {/* Display total shifts and total cost */}
            <div className="summary">
                <p>Total Shifts in a Week: {totalShifts}</p>
                <p>Total Cost of Shifts: ${totalCost.toFixed(2)}</p>
            </div>

            <table className="results-table">
                <thead>
                    <tr>
                        <th>Skill</th>
                        <th>Day</th>
                        <th>Time Begin</th>
                        <th>Time End</th>
                        <th>Price</th>
                        <th>Required Employees</th>
                    </tr>
                </thead>
                <tbody>
                    {results.length > 0 ? (
                        results.map((result, index) => (
                            <tr key={index}>
                                <td>{result.skill}</td>
                                <td>{result.day}</td>
                                <td>{result.time_begin}</td>
                                <td>{result.time_end}</td>
                                <td>${result.price}</td>
                                <td>{result.require}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="no-data">No results found</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Results;
