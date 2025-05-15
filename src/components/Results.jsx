import React from 'react';
import '../styles/Results.css';

const Results = ({ image, result }) => {
    if (!image || !result) return null;

    return (
        <div className="results-container">
            <div className="result-box">
                <h2>Analysis Results</h2>
                <p>Your crop appears to be: 
                    <span className={result.status}>
                        {result.status}
                    </span>
                </p>
                <p>Confidence: {result.confidence}%</p>
                {result.status === 'unhealthy' && (
                    <div className="recommendations">
                        <h3>Recommendations:</h3>
                        <ul>
                            <li>Check for pest infestations</li>
                            <li>Ensure proper irrigation</li>
                            <li>Verify nutrient levels</li>
                            <li>Consider consulting an agronomist</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Results;