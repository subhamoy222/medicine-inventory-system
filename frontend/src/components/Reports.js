import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await axios.get('/api/reports'); // Adjust the endpoint as needed
                setReports(response.data);
            } catch (err) {
                setError('Failed to fetch reports');
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    if (loading) return <div>Loading reports...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Reports</h1>
            {reports.length === 0 ? (
                <p>No reports available.</p>
            ) : (
                <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                        <tr>
                            <th className="border px-4 py-2">Report ID</th>
                            <th className="border px-4 py-2">Report Type</th>
                            <th className="border px-4 py-2">Date</th>
                            <th className="border px-4 py-2">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map(report => (
                            <tr key={report.id}>
                                <td className="border px-4 py-2">{report.id}</td>
                                <td className="border px-4 py-2">{report.type}</td>
                                <td className="border px-4 py-2">{new Date(report.date).toLocaleDateString()}</td>
                                <td className="border px-4 py-2">{report.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Reports;
