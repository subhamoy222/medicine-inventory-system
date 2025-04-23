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
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    averageOrderValue: 0,
    topSellingMedicines: [],
    salesGrowth: 0
  });

  // Set up axios default headers for JWT
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, []);

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
      let lowStockItems = [];
      let expiringSoonItems = [];
      const currentDate = new Date();

      inventoryData.forEach((item) => {
        // Check for low stock - only count items with quantity less than threshold
        if (item.quantity <= lowStockThreshold) {
          lowStockItems.push({
            name: item.itemName,
            quantity: item.quantity
          });
        }

        // Check for expiring items - only count non-expired items that will expire within threshold
        if (item.expiryDate) {
          const expirationDate = new Date(item.expiryDate);
          const daysToExpire = Math.ceil((expirationDate - currentDate) / (1000 * 3600 * 24));
          
          if (daysToExpire > 0 && daysToExpire <= expiringSoonThreshold) {
            expiringSoonItems.push({
              name: item.itemName,
              expiryDate: item.expiryDate,
              daysRemaining: daysToExpire
            });
          }
        }
      });

      // Update state with accurate counts
      setLowStockCount(lowStockItems.length);
      setExpiringSoonCount(expiringSoonItems.length);

      // Create notifications for both low stock and expiring items
      const lowStockNotifications = lowStockItems.map(item => ({
        type: "warning",
        message: `Low stock: ${item.name} (${item.quantity} units remaining)`,
      }));

      const expiringSoonNotifications = expiringSoonItems.map(item => ({
        type: "warning",
        message: `Expiring soon: ${item.name} (${item.daysRemaining} days remaining)`,
      }));

      // Sort notifications by urgency (low stock first, then expiring soon)
      setNotifications([...lowStockNotifications, ...expiringSoonNotifications]);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setInventoryCount(0);
      setLowStockCount(0);
      setExpiringSoonCount(0);
      setNotifications([{
        type: "warning",
        message: "Error loading inventory data"
      }]);
    }
  }, [email]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  const fetchAnalyticsData = useCallback(async () => {
    if (!email) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get('https://medicine-inventory-system.onrender.com/api/bills/medicine-sales', {
        params: {
          email,
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          endDate: new Date().toISOString()
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.salesDetails) {
        const sales = response.data.salesDetails;
        
        // Calculate total revenue
        const totalRevenue = sales.reduce((sum, sale) => 
          sum + (sale.mrp * sale.quantity - sale.discount), 0);

        // Calculate average order value
        const uniqueInvoices = [...new Set(sales.map(sale => sale.saleInvoiceNumber))];
        const averageOrderValue = totalRevenue / uniqueInvoices.length;

        // Get top selling medicines
        const medicineMap = sales.reduce((acc, sale) => {
          const key = sale.itemName;
          if (!acc[key]) acc[key] = 0;
          acc[key] += sale.quantity;
          return acc;
        }, {});

        const topSellingMedicines = Object.entries(medicineMap)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, quantity]) => ({ name, quantity }));

        setAnalyticsData({
          totalRevenue,
          averageOrderValue,
          topSellingMedicines,
          salesGrowth: 0 // This would need historical data comparison
        });
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    }
  }, [email]);

  useEffect(() => {
    fetchUserEmail();
  }, [fetchUserEmail]);

  useEffect(() => {
    if (email) {
      fetchDashboardData();
      fetchAnalyticsData();
    }
  }, [email, fetchDashboardData, fetchAnalyticsData]);

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
            <button
              onClick={() => navigate('/alerts')}
              className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm hover:bg-teal-200 transition-colors flex items-center space-x-2"
            >
              <span>🔔</span>
              <span>{notifications.length} Alerts</span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-sm hover:bg-red-600 transition-all"
            >
              <span>Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
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

          {/* Smart Bill Advisor (recommendations feature disabled) */}
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
                <div className="p-4 bg-white rounded-xl shadow-sm text-gray-500">
                  Recommendations feature unavailable.
                </div>
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

        {/* Enhanced Advanced Analytics Section */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-purple-100 rounded-xl">
              <span className="text-3xl text-purple-600">📊</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Advanced Analytics</h2>
          </div>
          
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-xl text-white">
              <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold">₹{analyticsData.totalRevenue.toFixed(2)}</p>
              <p className="text-sm opacity-80 mt-2">Last 30 days</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-xl text-white">
              <h3 className="text-lg font-semibold mb-2">Avg. Order Value</h3>
              <p className="text-3xl font-bold">₹{analyticsData.averageOrderValue.toFixed(2)}</p>
              <p className="text-sm opacity-80 mt-2">Per transaction</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-xl text-white">
              <h3 className="text-lg font-semibold mb-2">Top Selling</h3>
              <div className="space-y-1">
                {analyticsData.topSellingMedicines.slice(0, 3).map((medicine, index) => (
                  <p key={index} className="text-sm">
                    {medicine.name}: {medicine.quantity} units
                  </p>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-xl text-white">
              <h3 className="text-lg font-semibold mb-2">Growth</h3>
              <p className="text-3xl font-bold">
                {analyticsData.salesGrowth >= 0 ? '+' : ''}{analyticsData.salesGrowth}%
              </p>
              <p className="text-sm opacity-80 mt-2">vs. last month</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionButton 
              label="Sales Report"
              icon="💰"
              description="Daily/Weekly/Monthly sales trends"
              onClick={() => navigate("/medicine-sales-summary")}
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
              label="Alerts Center"
              icon="🔔"
              description={`${notifications.length} items need attention`}
              onClick={() => navigate("/alerts")}
              gradient="from-orange-400 to-red-400"
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
