import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PurchaseReturnForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    supplierName: '',
    originalBillNumber: '',
    items: [
      {
        itemName: '',
        batch: '',
        quantity: 0,
        purchaseRate: 0,
        amount: 0,
        expiryDate: '',
        returnableQuantity: 0
      }
    ]
  });

  const [suppliers, setSuppliers] = useState([]);
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calculations, setCalculations] = useState({
    totalAmount: 0,
    totalDiscount: 0,
    totalGST: 0,
    netAmount: 0
  });

  // Load email from localStorage on component mount
  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, []);

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!formData.email) return;
      
      try {
        const response = await axios.get('/api/suppliers', {
          params: { email: formData.email }
        });
        setSuppliers(response.data);
      } catch (err) {
        console.error('Error fetching suppliers:', err);
      }
    };

    if (formData.email) {
      fetchSuppliers();
    }
  }, [formData.email]);

  // Fetch supplier's purchase bills when supplier is selected
  useEffect(() => {
    const fetchPurchaseBills = async () => {
      if (!formData.supplierName || !formData.email) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/purchasebills`, {
          params: {
            email: formData.email,
            partyName: formData.supplierName
          }
        });
        setPurchaseBills(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching purchase bills:', err);
        setLoading(false);
      }
    };

    if (formData.supplierName && formData.email) {
      fetchPurchaseBills();
    }
  }, [formData.supplierName, formData.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value
    };
    setFormData({ ...formData, items: updatedItems });
    calculateTotals();
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          itemName: '',
          batch: '',
          quantity: 0,
          purchaseRate: 0,
          amount: 0,
          expiryDate: '',
          returnableQuantity: 0
        }
      ]
    });
  };

  const removeItemRow = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotals = () => {
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalGST = 0;

    formData.items.forEach(item => {
      if (item.quantity && item.purchaseRate) {
        const itemTotal = item.quantity * item.purchaseRate;
        const itemGST = itemTotal * 0.18; // 18% GST

        totalAmount += itemTotal;
        totalGST += itemGST;
      }
    });

    const netAmount = totalAmount + totalGST;

    setCalculations({
      totalAmount,
      totalDiscount,
      totalGST,
      netAmount
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await axios.post('/api/purchase-returns', formData);
      setSuccess('Purchase return bill created successfully!');
      setError('');
      
      // Reset form
      setFormData({
        ...formData,
        receiptNumber: '',
        originalBillNumber: '',
        items: [
          {
            itemName: '',
            batch: '',
            quantity: 0,
            purchaseRate: 0,
            amount: 0,
            expiryDate: '',
            returnableQuantity: 0
          }
        ]
      });
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Error creating purchase return bill');
      }
      console.error('Submit error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Purchase Return Bill</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    list="suppliersList"
                    required
                  />
                  <datalist id="suppliersList">
                    {suppliers.map((supplier, index) => (
                      <option key={index} value={supplier.name} />
                    ))}
                  </datalist>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Purchase Bill</label>
                <select
                  name="originalBillNumber"
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Purchase Bill</option>
                  {purchaseBills.map((bill, index) => (
                    <option key={index} value={bill._id}>
                      {bill.invoiceNumber} - {new Date(bill.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Return Items</h2>
            
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b border-r text-left">Item Name</th>
                    <th className="py-2 px-4 border-b border-r text-left">Batch</th>
                    <th className="py-2 px-4 border-b border-r text-center">Returnable Qty</th>
                    <th className="py-2 px-4 border-b border-r text-center">Return Qty</th>
                    <th className="py-2 px-4 border-b border-r text-center">Purchase Rate</th>
                    <th className="py-2 px-4 border-b border-r text-center">Expiry Date</th>
                    <th className="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="py-2 px-4 border-b border-r">
                        <input
                          type="text"
                          name="itemName"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-r">
                        <input
                          type="text"
                          name="batch"
                          value={item.batch}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md"
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-r text-center">
                        <span className="font-medium">{item.returnableQuantity}</span>
                      </td>
                      <td className="py-2 px-4 border-b border-r">
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, e)}
                          min="1"
                          max={item.returnableQuantity}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md mx-auto text-center"
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-r">
                        <input
                          type="number"
                          name="purchaseRate"
                          value={item.purchaseRate}
                          onChange={(e) => handleItemChange(index, e)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-md mx-auto text-center"
                          required
                        />
                      </td>
                      <td className="py-2 px-4 border-b border-r text-center">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2 px-4 border-b text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={formData.items.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mb-6">
              <button
                type="button"
                onClick={addItemRow}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Add Item
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Total Amount:</span>
                    <span>₹{calculations.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Total GST (18%):</span>
                    <span>₹{calculations.totalGST.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold">
                    <span>Net Refund Amount:</span>
                    <span>₹{calculations.netAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Create Purchase Return Bill'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturnForm; 