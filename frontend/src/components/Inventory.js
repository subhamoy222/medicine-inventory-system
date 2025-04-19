// // components/Inventory.js
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function Inventory() {
//   const [inventoryItems, setInventoryItems] = useState([]);

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       const response = await axios.get('/api/inventory'); // Adjust the API endpoint as needed
//       setInventoryItems(response.data);
//     } catch (error) {
//       console.error("Error fetching inventory:", error);
//     }
//   };

//   return (
//     <div className="container mx-auto mt-8">
//       <h2 className="text-2xl font-bold mb-4">Inventory</h2>
//       {inventoryItems.length > 0 ? (
//         <table className="w-full border border-gray-300">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="py-2 px-4 border">Item Name</th>
//               <th className="py-2 px-4 border">Batch</th>
//               <th className="py-2 px-4 border">Expiry Date</th>
//               <th className="py-2 px-4 border">Pack</th>
//               <th className="py-2 px-4 border">Quantity</th>
//               <th className="py-2 px-4 border">Purchase Rate</th>
//               <th className="py-2 px-4 border">MRP</th>
//               <th className="py-2 px-4 border">GST Percentage</th>
//               <th className="py-2 px-4 border">Description</th>
//             </tr>
//           </thead>
//           <tbody>
//             {inventoryItems.map((item, index) => (
//               <tr key={index} className="text-center">
//                 <td className="py-2 px-4 border">{item.itemName}</td>
//                 <td className="py-2 px-4 border">{item.batch}</td>
//                 <td className="py-2 px-4 border">{new Date(item.expiryDate).toLocaleDateString()}</td>
//                 <td className="py-2 px-4 border">{item.pack}</td>
//                 <td className="py-2 px-4 border">{item.quantity}</td>
//                 <td className="py-2 px-4 border">{item.purchaseRate}</td>
//                 <td className="py-2 px-4 border">{item.mrp}</td>
//                 <td className="py-2 px-4 border">{item.gstPercentage}%</td>
//                 <td className="py-2 px-4 border">{item.description || 'N/A'}</td>
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

// export default Inventory;


// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function Inventory() {
//   const [inventoryItems, setInventoryItems] = useState([]);

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       // Get the email from localStorage
//       const email = localStorage.getItem('email');
//       if (!email) {
//         console.error("No email found in localStorage");
//         return;
//       }

//       // Make API call with email directly in the URL
//       const response = await axios.get(`http://localhost:5000/api/inventory/${email}`);
//       setInventoryItems(response.data);  // Assuming response.data is an array of inventory items
//     } catch (error) {
//       console.error("Error fetching inventory:", error);
//     }
//   };

//   return (
//     <div className="container mx-auto mt-8">
//       <h2 className="text-2xl font-bold mb-4">Inventory</h2>
//       {inventoryItems.length > 0 ? (
//         <table className="w-full border border-gray-300">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="py-2 px-4 border">Item Name</th>
//               <th className="py-2 px-4 border">Batch</th>
//               <th className="py-2 px-4 border">Expiry Date</th>
//               <th className="py-2 px-4 border">Pack</th>
//               <th className="py-2 px-4 border">Quantity</th>
//               <th className="py-2 px-4 border">Purchase Rate</th>
//               <th className="py-2 px-4 border">MRP</th>
//               <th className="py-2 px-4 border">GST Percentage</th>
//               <th className="py-2 px-4 border">Description</th>
//             </tr>
//           </thead>
//           <tbody>
//             {inventoryItems.map((item, index) => (
//               <tr key={index} className="text-center">
//                 <td className="py-2 px-4 border">{item.itemName}</td>
//                 <td className="py-2 px-4 border">{item.batch}</td>
//                 <td className="py-2 px-4 border">{new Date(item.expiryDate).toLocaleDateString()}</td>
//                 <td className="py-2 px-4 border">{item.pack}</td>
//                 <td className="py-2 px-4 border">{item.quantity}</td>
//                 <td className="py-2 px-4 border">{item.purchaseRate}</td>
//                 <td className="py-2 px-4 border">{item.mrp}</td>
//                 <td className="py-2 px-4 border">{item.gstPercentage}%</td>
//                 <td className="py-2 px-4 border">{item.description || 'N/A'}</td>
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

// export default Inventory;

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = async () => {
    try {
      const email = localStorage.getItem('email');
      const token = localStorage.getItem('token');
      
      if (!email || !token) {
        throw new Error('Authentication required');
      }

      const response = await axios.get(
        `https://medicine-inventory-system.onrender.com/api/inventory/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setInventory(response.data);
      setError(null);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.response?.data?.message || error.message);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>
      
      {loading ? (
        <p className="text-gray-600">Loading inventory...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <>
          <p className="mb-4">Total Medicines: {inventory.length}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    'Item Name', 'Batch', 'Expiry Date', 'Pack',
                    'Quantity', 'Purchase Rate', 'MRP', 'GST (%)', 'Description'
                  ].map((header) => (
                    <th key={header} className="p-3 border text-left text-sm font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="p-3 border">{item.itemName}</td>
                    <td className="p-3 border">{item.batch}</td>
                    <td className="p-3 border">
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 border">{item.pack}</td>
                    <td className="p-3 border">{item.quantity}</td>
                    <td className="p-3 border">₹{item.purchaseRate?.toFixed(2)}</td>
                    <td className="p-3 border">₹{item.mrp?.toFixed(2)}</td>
                    <td className="p-3 border">{item.gstPercentage}%</td>
                    <td className="p-3 border">{item.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Inventory;
