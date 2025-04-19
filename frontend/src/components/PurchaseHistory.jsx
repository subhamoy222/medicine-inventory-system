import React, { useState } from 'react';
import axios from 'axios';

const PurchaseHistory = () => {
  const [gstNo, setGstNo] = useState('');
  const [itemName, setItemName] = useState('');
  const [batch, setBatch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // GST validation regex (matches backend validation)
  const validateGST = (gst) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setData(null);

    try {
      // Validate inputs
      if (!validateGST(gstNo)) {
        throw new Error('Invalid GST Number format. Example: 22ABCDE1234F1Z5');
      }
      if (!itemName.trim() || !batch.trim()) {
        throw new Error('Item Name and Batch Number are required');
      }

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      // API call with correct endpoint
      const response = await axios.get(
        `https://medicine-inventory-system.onrender.com/api/bills/purchase-history/${encodeURIComponent(gstNo)}`,
        {
          params: { 
            itemName: itemName.trim(),
            batch: batch.trim()
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Handle response data
      if (!response.data?.data) {
        throw new Error('No purchase history found for these parameters');
      }

      setData(response.data.data);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch purchase history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Purchase History Lookup</h1>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GST Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="22ABCDE1234F1Z5"
                required
              />
            </div>

            {/* Item Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter medicine name"
                required
              />
            </div>

            {/* Batch Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Number
              </label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter batch number"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg 
                  className="animate-spin h-5 w-5 mr-3 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </div>
            ) : (
              'Search Purchase History'
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Results Section */}
        {data && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Purchase Details</h2>
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">GST Number</p>
                  <p className="font-medium break-all">{data.gstNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Item Name</p>
                  <p className="font-medium">{data.itemName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch Number</p>
                  <p className="font-medium">{data.batch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Purchased</p>
                  <p className="font-medium text-blue-600">{data.totalPurchased}</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate (₹)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount (%)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.purchases.map((purchase, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        {new Date(purchase.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-mono text-blue-600">
                        {purchase.invoiceNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{purchase.quantity}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{purchase.rate?.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{purchase.discount}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {purchase.expiryDate ? 
                          new Date(purchase.expiryDate).toLocaleDateString() : 
                          'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistory;