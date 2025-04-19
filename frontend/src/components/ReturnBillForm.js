import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const ReturnBillForm = () => {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    partyName: '',
    gstNumber: '',
    date: new Date().toISOString().split('T')[0],
    items: []
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [originalBill, setOriginalBill] = useState(null);
  const [isValidInvoice, setIsValidInvoice] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
      amount: field === 'quantity' ? value * newItems[index].mrp : newItems[index].amount
    };
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemName: '',
        batch: '',
        quantity: '',
        mrp: '',
        amount: ''
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const checkInvoice = async () => {
    try {
      setLoading(true);
      setMessage('');
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');

      const response = await axios.post(
        'https://medicine-inventory-system.onrender.com/api/bills/check-invoice',
        {
          invoiceNumber: formData.invoiceNumber,
          email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.valid) {
        setOriginalBill(response.data.bill);
        setIsValidInvoice(true);
        setFormData(prev => ({
          ...prev,
          partyName: response.data.bill.partyName,
          gstNumber: response.data.bill.gstNumber,
          items: response.data.bill.items.map(item => ({
            ...item,
            quantity: '', // Reset quantity for return
            amount: 0
          }))
        }));
        setMessage('Invoice is valid. You can proceed with the return.');
      }
    } catch (error) {
      setIsValidInvoice(false);
      setOriginalBill(null);
      setMessage(error.response?.data?.message || 'Error checking invoice');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`GSTIN: ${formData.gstNumber}`, 10, 10);
    doc.text(`Return Invoice Number: RET-${formData.invoiceNumber}`, 10, 20);
    doc.text(`Original Invoice Number: ${formData.invoiceNumber}`, 10, 30);
    doc.text(`Date: ${formData.date}`, 10, 40);
    doc.text(`Party Name: ${formData.partyName}`, 10, 50);
    
    const headers = [
      "Item Name",
      "Batch",
      "Qty",
      "MRP",
      "Amount"
    ];

    let y = 70;
    headers.forEach((header, i) => {
      doc.text(header, 10 + i * 35, y);
    });

    formData.items.forEach((item) => {
      y += 10;
      [
        item.itemName,
        item.batch,
        item.quantity,
        item.mrp,
        item.amount
      ].forEach((value, i) => {
        doc.text(String(value || "-"), 10 + i * 35, y);
      });
    });

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.mrp), 0);
    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 10, y + 20);
    
    doc.save("return-invoice.pdf");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage('');
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');

      // Validate quantities
      for (const item of formData.items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new Error('Please enter valid quantities for all items');
        }
        if (item.quantity > item.originalQuantity) {
          throw new Error(`Return quantity cannot exceed original quantity for ${item.itemName}`);
        }
      }

      const response = await axios.post(
        'https://medicine-inventory-system.onrender.com/api/bills/return',
        {
          ...formData,
          email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMessage('Return bill created successfully!');
      generatePDF();
      
      // Reset form
      setFormData({
        invoiceNumber: '',
        partyName: '',
        gstNumber: '',
        date: new Date().toISOString().split('T')[0],
        items: []
      });
      setIsValidInvoice(false);
      setOriginalBill(null);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Error creating return bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-indigo-600 mb-2">Create Return Bill</h2>
          <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  disabled={isValidInvoice}
                />
                <button
                  type="button"
                  onClick={checkInvoice}
                  disabled={loading || isValidInvoice}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {loading ? 'Checking...' : 'Check Invoice'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Party Name</label>
              <input
                type="text"
                name="partyName"
                value={formData.partyName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={isValidInvoice}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
                disabled={isValidInvoice}
              />
            </div>
          </div>

          {isValidInvoice && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold text-indigo-600 mb-4">Items</h3>
              <div className="rounded-xl border-2 border-indigo-50">
                <table className="w-full">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      {["Item Name", "Batch", "Original Qty", "Return Qty", "MRP", "Amount"].map((header, idx) => (
                        <th 
                          key={idx}
                          className="px-4 py-3 text-left text-sm font-medium last:text-right"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50">
                    {formData.items.map((item, index) => (
                      <tr 
                        key={index}
                        className="hover:bg-indigo-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.itemName}
                            className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                            disabled
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.batch}
                            className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                            disabled
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.originalQuantity}
                            className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                            disabled
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                            required
                            min="1"
                            max={item.originalQuantity}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.mrp}
                            className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                            disabled
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">
                          {item.amount || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="submit"
              disabled={!isValidInvoice || loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 disabled:bg-gray-400"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Create Return Bill"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnBillForm;





