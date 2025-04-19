// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// function Dashboard() {
//   const navigate = useNavigate();
//   const [inventoryCount, setInventoryCount] = useState(0);
//   const [lowStockCount, setLowStockCount] = useState(0);
//   const [expiringSoonCount, setExpiringSoonCount] = useState(0);
//   const [recentPurchases, setRecentPurchases] = useState([]);
//   const [recentSales, setRecentSales] = useState([]);
//   const [notifications, setNotifications] = useState([]);

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       const inventoryRes = await axios.get('http://localhost:5000/api/inventory');
//       console.log("Inventory Response:", inventoryRes.data); // Log the response to inspect it
//       //const lowStockRes = await axios.get('/api/inventory/low-stock');
//       //const expiringSoonRes = await axios.get('/api/inventory/expiring-soon');
//       //const purchasesRes = await axios.get('/api/purchases/recent');
//       //const salesRes = await axios.get('/api/sales/recent');
  
//       const totalInventory = inventoryRes.data.length; // Calculate total inventory
//       console.log("Total Inventory Count:", totalInventory); // Log the inventory count
  
//       setInventoryCount(totalInventory);
//       //setLowStockCount(lowStockRes.data.count);
//       //setExpiringSoonCount(expiringSoonRes.data.count);
//       //setRecentPurchases(purchasesRes.data);
//       //setRecentSales(salesRes.data);
//       /*setNotifications([
//         { message: `${lowStockRes.data.count} items are low on stock`, type: 'warning' },
//         { message: `${expiringSoonRes.data.count} items expiring soon`, type: 'danger' }
//       ]);*/
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     }
//   };
  
  

//   return (
//     <div className="dashboard-container">
//       {/* Notifications */}
//       <div className="notifications bg-red-100 text-red-800 rounded-lg p-4 shadow-md mb-4">
//         <h2 className="text-lg font-semibold mb-2">Notifications</h2>
//         {notifications.map((note, index) => (
//           <div key={index} className={`p-2 mb-2 ${note.type === 'warning' ? 'bg-yellow-200' : 'bg-red-200'} rounded`}>
//             {note.message}
//           </div>
//         ))}
//       </div>

//       {/* Main Content */}
//       <div className="main-content flex flex-col items-center">
//         {/* Inventory Overview and Quick Actions side by side */}
//         <div className="flex flex-col md:flex-row justify-center items-center w-full max-w-4xl mb-6">
//           {/* Inventory Overview */}
//           <div className="overview bg-blue-600 text-white rounded-lg p-6 shadow-md md:w-1/2 md:mr-4 mb-4 md:mb-0">
//             <h2 className="text-lg font-semibold mb-2">Inventory Overview</h2>
//             <p>Total Medicines: {inventoryCount}</p>
//             <p>Low Stock: {lowStockCount}</p>
//             <p>Expiring Soon: {expiringSoonCount}</p>
//             <button
//   onClick={() => navigate('/view-inventory')} // Change to the new route
//   className="mt-4 bg-blue-800 text-white py-2 px-4 rounded"
// >
//   View Inventory
// </button>
//           </div>

//           {/* Quick Actions */}
//           <div className="quick-actions bg-green-600 text-white rounded-lg p-6 shadow-md md:w-1/2 md:ml-4">
//             <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
//             <button
//               onClick={() => navigate('/add-medicine')}
//               className="bg-green-800 text-white w-full py-2 mb-2 rounded"
//             >
//               Add New Medicine
//             </button>
//             <button
//               onClick={() => navigate('/generate-bill')}
//               className="bg-green-800 text-white w-full py-2 mb-2 rounded"
//             >
//               Generate Bill
//             </button>
//             <button
//               onClick={() => navigate('/reports')}
//               className="bg-green-800 text-white w-full py-2 rounded"
//             >
//               View Reports
//             </button>
//           </div>
//         </div>

//         {/* Recent Purchases and Sales */}
//         <div className="recent-data grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
//           {/* Recent Purchases */}
//           <div className="recent-purchases bg-white rounded-lg p-4 shadow-md">
//             <h2 className="text-lg font-semibold mb-2">Recent Purchases</h2>
//             <ul>
//               {recentPurchases.map((purchase, index) => (
//                 <li key={index} className="border-b py-2">
//                   {purchase.name} - {purchase.quantity} units
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Recent Sales */}
//           <div className="recent-sales bg-white rounded-lg p-4 shadow-md">
//             <h2 className="text-lg font-semibold mb-2">Recent Sales</h2>
//             <ul>
//               {recentSales.map((sale, index) => (
//                 <li key={index} className="border-b py-2">
//                   {sale.name} - {sale.quantity} units
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode"; // Correct import for newer versions
// import axios from "axios";

// function Dashboard() {
//   const navigate = useNavigate();
//   const [inventoryCount, setInventoryCount] = useState(0);
//   const [lowStockCount, setLowStockCount] = useState(0);
//   const [expiringSoonCount, setExpiringSoonCount] = useState(0);
//   const [notifications, setNotifications] = useState([]);
//   const [email, setEmail] = useState("");

//   useEffect(() => {
//     fetchDashboardData();
//     fetchUserEmail();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       const inventoryRes = await axios.get("http://localhost:5000/api/inventory");
//       const inventoryData = inventoryRes.data;

//       setInventoryCount(inventoryData.length);

//       const lowStockThreshold = 10;
//       const expiringSoonThreshold = 30;
//       let lowStock = 0;
//       let expiringSoon = 0;
//       const currentDate = new Date();

//       inventoryData.forEach((item) => {
//         if (item.stock < lowStockThreshold) {
//           lowStock++;
//         }

//         const expirationDate = new Date(item.expiryDate);
//         const daysToExpire =
//           (expirationDate - currentDate) / (1000 * 3600 * 24);

//         if (daysToExpire <= expiringSoonThreshold && daysToExpire >= 0) {
//           expiringSoon++;
//         }
//       });

//       setLowStockCount(lowStock);
//       setExpiringSoonCount(expiringSoon);
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     }
//   };

//   const fetchUserEmail = () => {
//     const token = localStorage.getItem("authToken");
//     if (token) {
//       try {
//         const decodedToken = jwtDecode(token);
//         setEmail(decodedToken.email || "Unknown User");
//       } catch (err) {
//         console.error("Invalid token:", err);
//         setEmail("Unknown User");
//       }
//     } else {
//       setEmail("Not Logged In");
//     }
//   };

//   return (
//     <div className="dashboard-container p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
//       {/* Notifications Section */}
//       <div className="notifications bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg p-6 shadow-xl w-full mb-6">
//         <h2 className="text-2xl font-bold mb-3 text-center">Notifications</h2>
//         {notifications.length === 0 ? (
//           <p className="text-sm text-center opacity-75">No new notifications</p>
//         ) : (
//           notifications.map((note, index) => (
//             <div
//               key={index}
//               className={`p-3 mb-4 rounded-xl transition-all duration-300 ease-in-out ${
//                 note.type === "warning" ? "bg-yellow-200" : "bg-red-200"
//               }`}
//             >
//               {note.message}
//             </div>
//           ))
//         )}
//       </div>

//       {/* Welcome Section */}
//       <div className="welcome bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg p-8 shadow-2xl w-full mb-8">
//         <h1 className="text-3xl font-bold text-center">Welcome, {email || "Guest"}!</h1>
//         <p className="mt-3 text-lg text-center opacity-80">
//           We’re glad to have you back. Here's an overview of your system.
//         </p>
//       </div>

//       {/* Main Content */}
//       <div className="main-content flex flex-col md:flex-row items-center justify-center w-full max-w-7xl gap-8">
//         {/* Inventory Overview */}
//         <div className="box bg-white text-gray-800 rounded-lg p-8 shadow-lg w-full md:w-1/2 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
//           <h2 className="text-xl font-semibold mb-4 text-indigo-600">Inventory Overview</h2>
//           <p className="mb-3 text-lg">
//             <span className="font-semibold text-indigo-700">Total Medicines:</span> {inventoryCount}
//           </p>
//           <p className="mb-3 text-lg">
//             <span className="font-semibold text-indigo-700">Low Stock:</span> {lowStockCount}
//           </p>
//           <p className="text-lg">
//             <span className="font-semibold text-indigo-700">Expiring Soon:</span> {expiringSoonCount}
//           </p>
//           <button
//             onClick={() => navigate("/view-inventory")}
//             className="mt-5 bg-indigo-600 hover:bg-indigo-800 text-white py-2 px-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
//           >
//             View Inventory
//           </button>
//         </div>

//         {/* Quick Actions */}
//         <div className="box bg-gradient-to-r from-green-400 to-teal-600 text-white rounded-lg p-8 shadow-lg w-full md:w-1/2 transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-105">
//           <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
//           <button
//             onClick={() => navigate("/add-medicine")}
//             className="bg-green-600 hover:bg-green-700 text-white w-full py-3 mb-4 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
//           >
//             Add New Medicine
//           </button>
//           <button
//             onClick={() => navigate("/generate-bill")}
//             className="bg-green-600 hover:bg-green-700 text-white w-full py-3 mb-4 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
//           >
//             Generate Bill
//           </button>
//           <button
//             onClick={() => navigate("/reports")}
//             className="bg-green-600 hover:bg-green-700 text-white w-full py-3 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
//           >
//             View Reports
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Dashboard() {
  const navigate = useNavigate();
  const [inventoryCount, setInventoryCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [email, setEmail] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const fetchUserEmail = useCallback(() => {
    const storedEmail = localStorage.getItem("email");
    setEmail(storedEmail || "Guest");
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!email) return;
    try {
      const inventoryRes = await axios.get(`https://medicine-inventory-system.onrender.com/api/inventory/${email}`);
      const inventoryData = inventoryRes.data;

      setInventoryCount(inventoryData.length);

      const lowStockThreshold = 10;
      const expiringSoonThreshold = 30;
      let lowStock = 0;
      let expiringSoon = 0;
      const currentDate = new Date();

      inventoryData.forEach((item) => {
        if (item.quantity < lowStockThreshold) lowStock++;
        const expirationDate = new Date(item.expiryDate);
        const daysToExpire = (expirationDate - currentDate) / (1000 * 3600 * 24);
        if (daysToExpire <= expiringSoonThreshold && daysToExpire >= 0) expiringSoon++;
      });

      setLowStockCount(lowStock);
      setExpiringSoonCount(expiringSoon);

      const lowStockNotifications = inventoryData
        .filter((item) => item.quantity < lowStockThreshold)
        .map((item) => ({
          type: "warning",
          message: `Low stock: ${item.itemName} (${item.quantity} units remaining)`,
        }));

      const expiringSoonNotifications = inventoryData
        .filter((item) => (new Date(item.expiryDate) - currentDate) / (1000 * 3600 * 24) <= expiringSoonThreshold)
        .map((item) => ({
          type: "warning",
          message: `Expiring soon: ${item.itemName} (expires on ${new Date(item.expiryDate).toLocaleDateString()})`,
        }));

      setNotifications([...lowStockNotifications, ...expiringSoonNotifications]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, [email]);

  const fetchRecommendations = useCallback(async () => {
    if (!email) return;
    try {
      const res = await axios.get(`https://medicine-inventory-system.onrender.com/api/recommendations/${email}`);
      setRecommendations(res.data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  }, [email]);

  useEffect(() => {
    fetchUserEmail();
    fetchDashboardData();
    fetchRecommendations();
  }, [fetchUserEmail, fetchDashboardData, fetchRecommendations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-indigo-50 p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-teal-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl animate-blob"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-200 rounded-full opacity-20 mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {email || "Guest"}!
            </h1>
            <p className="text-gray-600">Pharmacy Management Dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
              {notifications.length} Alerts
            </span>
            <button className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all">
              <span className="text-gray-700">Profile</span>
              <span className="text-teal-600">👨⚕️</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Inventory Health Card */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-teal-100 rounded-xl">
                <span className="text-3xl text-teal-600">💊</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Inventory Health</h2>
            </div>
            <div className="space-y-4">
              <MetricItem 
                label="Total Medicines"
                value={inventoryCount}
                icon="📦"
                color="teal"
                onClick={() => navigate("/inventory")}
              />
              <MetricItem 
                label="Low Stock"
                value={lowStockCount}
                icon="⚠️"
                color="amber"
                onClick={() => navigate("/view-inventory?filter=low-stock")}
              />
              <MetricItem 
                label="Expiring Soon"
                value={expiringSoonCount}
                icon="⌛"
                color="rose"
                onClick={() => navigate("/view-inventory?filter=expiring-soon")}
              />
            </div>
          </div>

          {/* Smart Bill Advisor */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <span className="text-3xl text-indigo-600">📈</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Smart Bill Advisor</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 mb-4">Purchase Recommendations</h3>
                {recommendations.map((item, index) => (
                  <div key={index} className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        item.recommendation === "Buy" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {item.recommendation}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Expires in {item.daysToExpire} days
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                <div className="grid grid-cols-1 gap-4">
                  <ActivityItem 
                    title="Today's Sales"
                    amount="₹24,500"
                    icon="💰"
                    color="green"
                  />
                  <ActivityItem 
                    title="Monthly Revenue"
                    amount="₹3,42,800"
                    icon="📆"
                    color="indigo"
                  />
                  <ActivityItem 
                    title="Active Customers"
                    amount="1,242"
                    icon="👥"
                    color="purple"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <span className="text-3xl text-purple-600">📊</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Advanced Analytics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton 
              label="Sales Report"
              icon="💰"
              description="Daily/Weekly/Monthly sales trends"
              onClick={() => navigate("/reports")}
              gradient="from-green-400 to-blue-400"
            />
            <ActionButton 
              label="Inventory Report"
              icon="📦"
              description="Stock levels & valuation"
              onClick={() => navigate("/view-inventory")}
              gradient="from-teal-400 to-cyan-400"
            />
            <ActionButton 
              label="Purchase History"
              icon="🕰️"
              description="Detailed purchase records"
              onClick={() => navigate("/purchase-history")}
              gradient="from-purple-500 to-pink-500"
            />
            <ActionButton 
              label="Generate Bill"
              icon="🧾"
              description="Create new purchase/sell/return bills"
              onClick={() => navigate("/generate-bill")}
              gradient="from-blue-400 to-purple-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
const MetricItem = ({ label, value, icon, color, onClick }) => {
  const colorClasses = {
    teal: { bg: "bg-teal-100", text: "text-teal-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
    rose: { bg: "bg-rose-100", text: "text-rose-600" }
  };

  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center space-x-3">
        <span className={`text-2xl ${colorClasses[color].bg} p-2 rounded-lg ${colorClasses[color].text}`}>
          {icon}
        </span>
        <span className="text-gray-700">{label}</span>
      </div>
      <span className={`text-xl font-bold ${colorClasses[color].text}`}>{value}</span>
    </div>
  );
};

const ActivityItem = ({ title, amount, icon, color }) => {
  const colorClasses = {
    green: { bg: "bg-green-50", text: "text-green-600", hover: "hover:bg-green-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", hover: "hover:bg-indigo-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", hover: "hover:bg-purple-100" }
  };

  return (
    <div className={`p-4 ${colorClasses[color].bg} rounded-xl ${colorClasses[color].hover} transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`text-2xl ${colorClasses[color].text}`}>{icon}</span>
          <span className="text-gray-700">{title}</span>
        </div>
        <span className={`text-lg font-semibold ${colorClasses[color].text}`}>{amount}</span>
      </div>
    </div>
  );
};

const ActionButton = ({ label, icon, description, onClick, gradient }) => (
  <button 
    onClick={onClick}
    className={`group relative flex flex-col items-center p-6 rounded-xl bg-gradient-to-br ${gradient} 
      hover:shadow-xl transition-all transform hover:scale-[1.02] min-h-[180px] justify-between
      overflow-hidden`}
  >
    <div className="absolute inset-0 bg-black/5 transition-all group-hover:bg-black/10"></div>
    
    <div className="z-10 w-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl text-white drop-shadow-md">{icon}</span>
        <span className="text-white/80 text-sm">View Report →</span>
      </div>
      
      <div className="text-left">
        <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
        <p className="text-sm text-white/90 leading-tight">{description}</p>
      </div>
    </div>
  </button>
);

export default Dashboard;