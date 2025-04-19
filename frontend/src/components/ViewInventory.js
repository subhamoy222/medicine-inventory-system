// // src/components/ViewInventory.js

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function ViewInventory() {
//   const [inventory, setInventory] = useState([]);

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/api/inventory'); // Ensure this endpoint matches your backend
//       setInventory(response.data); // Assuming response.data is an array of inventory items
//     } catch (error) {
//       console.error('Error fetching inventory:', error);
//     }
//   };

//   return (
//     <div className="view-inventory-container">
//       <h2 className="text-lg font-semibold mb-4">Inventory List</h2>
//       <table className="min-w-full bg-white border border-gray-300">
//         <thead>
//           <tr>
//             <th className="border-b p-2">Item Name</th>
//             <th className="border-b p-2">Quantity</th>
//             <th className="border-b p-2">Purchase Rate</th>
//             <th className="border-b p-2">MRP</th>
//             <th className="border-b p-2">Expiry Date</th>
//             <th className="border-b p-2">Batch</th>
//             <th className="border-b p-2">GST (%)</th>
//           </tr>
//         </thead>
//         <tbody>
//           {inventory.map((item) => (
//             <tr key={item._id}>
//               <td className="border-b p-2">{item.itemName}</td>
//               <td className="border-b p-2">{item.quantity}</td>
//               <td className="border-b p-2">{item.purchaseRate}</td>
//               <td className="border-b p-2">{item.mrp}</td>
//               <td className="border-b p-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
//               <td className="border-b p-2">{item.batch}</td>
//               <td className="border-b p-2">{item.gstPercentage}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export default ViewInventory;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function ViewInventory() {
//   const [inventory, setInventory] = useState([]);

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       // Get the logged-in user's email from localStorage
//       const email = localStorage.getItem('email');
//       console.log("Retrieved email:", email);  // Check if email is being fetched correctly
//       if (!email) {
//         console.error('No email found in localStorage');
//         return;
//       }

//       // Use the email directly in the API call
//       const response = await axios.get(`http://localhost:5000/api/inventory/${email}`);
//       console.log("Inventory response:", response.data);  // Check the response data
//       setInventory(response.data); // Assuming response.data is an array of inventory items
//     } catch (error) {
//       console.error('Error fetching inventory:', error);
//     }
//   };

//   return (
//     <div className="view-inventory-container">
//       <h2 className="text-lg font-semibold mb-4">Inventory List</h2>
//       {console.log("Inventory State:", inventory)}  {/* Check the inventory state */}
//       {inventory.length > 0 ? (
//         <table className="min-w-full bg-white border border-gray-300">
//           <thead>
//             <tr>
//               <th className="border-b p-2">Item Name</th>
//               <th className="border-b p-2">Batch</th>
//               <th className="border-b p-2">Expiry Date</th>
//               <th className="border-b p-2">Pack</th>
//               <th className="border-b p-2">Quantity</th>
//               <th className="border-b p-2">Purchase Rate</th>
//               <th className="border-b p-2">MRP</th>
//               <th className="border-b p-2">GST (%)</th>
//               <th className="border-b p-2">Description</th>
//             </tr>
//           </thead>
//           <tbody>
//             {inventory.map((item) => (
//               <tr key={item._id}>
//                 <td className="border-b p-2">{item.itemName}</td>
//                 <td className="border-b p-2">{item.batch}</td>
//                 <td className="border-b p-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
//                 <td className="border-b p-2">{item.pack}</td>
//                 <td className="border-b p-2">{item.quantity}</td>
//                 <td className="border-b p-2">{item.purchaseRate}</td>
//                 <td className="border-b p-2">{item.mrp}</td>
//                 <td className="border-b p-2">{item.gstPercentage}</td>
//                 <td className="border-b p-2">{item.description || 'N/A'}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       ) : (
//         <p>No inventory items available.</p>
//       )}
//     </div>
//   );
// }

// export default ViewInventory;


import React, { useEffect, useState } from "react";
import axios from "axios";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState(""); // For searching an item by name
  const [selectedItem, setSelectedItem] = useState(null); // Selected item by name
  const [selectedBatch, setSelectedBatch] = useState(""); // Selected batch
  const [productInfo, setProductInfo] = useState(null); // Information of the selected batch

  // Fetch inventory by email
  const fetchInventory = async () => {
    try {
      const email = localStorage.getItem("email"); // Assuming email is stored in localStorage
      if (!email) {
        throw new Error("No email found in localStorage");
      }
      const response = await axios.get(
        `https://medicine-inventory-system.onrender.com/api/inventory/${email}`
      );
      setInventory(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error.message);
      setError(error.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSearch = () => {
    const item = inventory.filter(
      (invItem) =>
        invItem.itemName.toLowerCase() === searchTerm.trim().toLowerCase()
    );
    setSelectedItem(item);
    setSelectedBatch(""); // Reset selected batch on new search
    setProductInfo(null); // Reset product info
  };

  const handleBatchSelection = (batch) => {
    setSelectedBatch(batch);
    const info = selectedItem.find((item) => item.batch === batch);
    setProductInfo(info);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-semibold text-indigo-600 animate-pulse">
          Loading Inventory...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-semibold text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-indigo-600 text-center mb-6">
        Inventory Overview
      </h1>

      {/* Search Section */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6 p-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search by item name"
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>

      {/* Batch Selection and Product Information */}
      {selectedItem && selectedItem.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6 p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Available Batches for:{" "}
            <span className="text-indigo-600">{selectedItem[0].itemName}</span>
          </h2>
          <select
            className="w-full border rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={selectedBatch}
            onChange={(e) => handleBatchSelection(e.target.value)}
          >
            <option value="">Select a batch</option>
            {selectedItem.map((item) => (
              <option key={item.batch} value={item.batch}>
                {item.batch}
              </option>
            ))}
          </select>

          {productInfo && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Product Details
              </h3>
              <p>
                <strong>Item Name:</strong> {productInfo.itemName}
              </p>
              <p>
                <strong>Batch:</strong> {productInfo.batch}
              </p>
              <p>
                <strong>Expiry Date:</strong>{" "}
                {new Date(productInfo.expiryDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Pack:</strong> {productInfo.pack}
              </p>
              <p>
                <strong>Quantity:</strong> {productInfo.quantity}
              </p>
              <p>
                <strong>Purchase Rate:</strong> ₹{productInfo.purchaseRate}
              </p>
              <p>
                <strong>MRP:</strong> ₹{productInfo.mrp}
              </p>
              <p>
                <strong>GST (%):</strong> {productInfo.gstPercentage}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {productInfo.description || <span className="italic">N/A</span>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Inventory Table */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="table-auto w-full text-left border-collapse bg-gradient-to-r from-indigo-100 to-purple-100">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="border p-3 font-semibold">Item Name</th>
              <th className="border p-3 font-semibold">Batch</th>
              <th className="border p-3 font-semibold">Expiry Date</th>
              <th className="border p-3 font-semibold">Pack</th>
              <th className="border p-3 font-semibold">Quantity</th>
              <th className="border p-3 font-semibold">Purchase Rate</th>
              <th className="border p-3 font-semibold">MRP</th>
              <th className="border p-3 font-semibold">GST (%)</th>
              <th className="border p-3 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr
                key={item._id || index}
                className={`hover:bg-indigo-50 transition duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="border p-3">{item.itemName}</td>
                <td className="border p-3">{item.batch}</td>
                <td className="border p-3">
                  {new Date(item.expiryDate).toLocaleDateString()}
                </td>
                <td className="border p-3">{item.pack}</td>
                <td className="border p-3">{item.quantity}</td>
                <td className="border p-3">₹{item.purchaseRate}</td>
                <td className="border p-3">₹{item.mrp}</td>
                <td className="border p-3">{item.gstPercentage}%</td>
                <td className="border p-3">
                  {item.description || <span className="italic">N/A</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;

