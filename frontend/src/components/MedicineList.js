import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const MedicineList = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const token = localStorage.getItem('token');
            const email = localStorage.getItem('email');

            const response = await axios.get('https://medicine-inventory-system.onrender.com/api/inventory', {
                params: { email },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMedicines(response.data);
            setLoading(false);
        } catch (error) {
            toast.error('Error fetching medicines');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return <div className="text-center p-4">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Medicine Inventory</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {medicines.map((medicine) => (
                            <tr key={medicine._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{medicine.itemName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medicine.batch}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(medicine.expiryDate)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medicine.pack}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medicine.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medicine.purchaseRate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medicine.mrp}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{medicine.gstPercentage}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MedicineList; 