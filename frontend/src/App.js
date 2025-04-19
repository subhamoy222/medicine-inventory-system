import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import ViewInventory from './components/ViewInventory';
import GenerateBillOptions from './components/GenerateBillOptions';
import PurchaseBillForm from './components/PurchaseBillForm'; // Ensure this is created
import SellBillForm from './components/SellBillForm'; // Ensure this is created
import ReturnBillForm from './components/ReturnBillForm'; // Ensure this is created
import ExpiryBillForm from './components/ExpiryBillForm';
import BillGenerationDocs from './components/BillGenerationDocs';
import PurchaseHistory from './components/PurchaseHistory';
import PartyInvoiceSearch from './components/PartyInvoiceSearch';
import { Toaster } from 'react-hot-toast';
// import ExpiryBillList from './components/ExpiryBills/ExpiryBillList.js';
// import CreateExpiryBill from './components/ExpiryBills/CreateExpiryBill.js';
// import ViewExpiryBill from './components/ExpiryBills/ViewExpiryBill.js';
// import DeleteExpiryBill from './components/ExpiryBills/DeleteExpiryBill.js';

function App() {
  return (
    <Router>
      <div className="App">
      <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Layout />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/view-inventory" element={<ViewInventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/generate-bill" element={<GenerateBillOptions />} />
          <Route 
        path="/documentation/bill-generation" 
        element={<BillGenerationDocs />} 
      />
          <Route path="/purchase-bill" element={<PurchaseBillForm />} />
          <Route path="/sell-bill" element={<SellBillForm />} />
          <Route path="/return-bill" element={<ReturnBillForm />} />
          <Route path="/expiry-bill" element={<ExpiryBillForm />} />
          <Route path="/purchase-history" element={<PurchaseHistory />} />
          <Route path="/party-invoices" element={<PartyInvoiceSearch />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
