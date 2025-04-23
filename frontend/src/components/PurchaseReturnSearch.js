import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const PurchaseReturnSearch = () => {
    const [email, setEmail] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.get(`${API_BASE_URL}/api/purchase-returns/returnable-quantities`, {
                params: { email, supplierName }
            });
            
            // Process the data to calculate totals
            const items = response.data;
            const processedItems = items.map(item => ({
                ...item,
                totalPurchaseValue: item.purchasedQuantity * item.purchaseRate,
                totalSaleValue: item.soldQuantity * item.mrp,
                avgPrice: item.purchaseRate,
                expiryStatus: getExpiryStatus(item.expiryDate)
            }));
            
            setSearchResults(processedItems);
        } catch (err) {
            setError(err.response?.data?.message || 'Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    const getExpiryStatus = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const monthsLeft = (expiry - today) / (1000 * 60 * 60 * 24 * 30);
        
        if (monthsLeft < 0) return 'expired';
        if (monthsLeft < 3) return 'nearExpiry';
        return 'good';
    };

    const downloadPDF = async (item) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/purchase-returns/download/pdf/${item.returnInvoiceNumber}.pdf`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${item.returnInvoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Error downloading PDF');
        }
    };

    const calculateTotals = () => {
        return searchResults.reduce((acc, item) => ({
            totalPurchaseValue: acc.totalPurchaseValue + (item.purchasedQuantity * item.purchaseRate),
            totalSaleValue: acc.totalSaleValue + (item.soldQuantity * item.mrp),
            totalPurchasedQty: acc.totalPurchasedQty + item.purchasedQuantity,
            totalSoldQty: acc.totalSoldQty + item.soldQuantity
        }), {
            totalPurchaseValue: 0,
            totalSaleValue: 0,
            totalPurchasedQty: 0,
            totalSoldQty: 0
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Search Form */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-bold text-indigo-800 mb-6">Purchase Return Search</h2>
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">Supplier Name</label>
                            <input
                                type="text"
                                value={supplierName}
                                onChange={(e) => setSupplierName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {searchResults.length > 0 && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            {Object.entries(calculateTotals()).map(([key, value]) => (
                                <div key={key} className="bg-white rounded-lg shadow-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </h3>
                                    <p className="text-2xl font-bold text-indigo-600">
                                        {key.includes('Value') ? `₹${value.toFixed(2)}` : value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Results Table */}
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Purchase Value</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sale Value</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {searchResults.map((item, index) => (
                                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.batch}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.purchasedQuantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.soldQuantity}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.avgPrice.toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.totalPurchaseValue.toFixed(2)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.totalSaleValue.toFixed(2)}</td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                                    item.expiryStatus === 'expired' ? 'text-red-600' :
                                                    item.expiryStatus === 'nearExpiry' ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                    {new Date(item.expiryDate).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PurchaseReturnSearch; 