import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://medicine-inventory-system.onrender.com';

const PurchaseReturnForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    supplierName: '',
    supplierGST: '',
    items: [
      {
        itemName: '',
        batch: '',
        quantity: 0,
        purchaseRate: 0,
        mrp: 0,
        discount: 0,
        gstPercentage: 0,
        expiryDate: '',
        returnableQuantity: 0
      }
    ]
  });

  const [suppliers, setSuppliers] = useState([]);
  const [returnableItems, setReturnableItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isBillsLoaded, setIsBillsLoaded] = useState(false);
  const [calculations, setCalculations] = useState({
    totalAmount: 0,
    totalDiscount: 0,
    totalGST: 0,
    netAmount: 0
  });

  // Load email from localStorage on component mount
  useEffect(() => {
    const userEmail = localStorage.getItem('email');
    if (userEmail) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, []);

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      if (!formData.email) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/suppliers`, {
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

  const handleLoadBills = async () => {
    if (!formData.supplierName || !formData.email) {
      setError('Please enter supplier name');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/purchase-returns/returnable-quantities`, {
        params: {
          email: formData.email,
          supplierName: formData.supplierName
        }
      });
      setReturnableItems(response.data);
      setIsBillsLoaded(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching returnable quantities:', err);
      setError('Error loading bills. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'supplierName') {
      setIsBillsLoaded(false);
      setReturnableItems([]);
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: value
    };

    // If item name changes, update available batches and other details
    if (name === 'itemName') {
      updatedItems[index].batch = ''; // Reset batch when item changes
      const returnableItem = returnableItems.find(
        item => item.itemName.toLowerCase() === value.toLowerCase()
      );
      if (returnableItem) {
        updatedItems[index].returnableQuantity = returnableItem.returnableQuantity;
        updatedItems[index].purchaseRate = returnableItem.purchaseRate;
        updatedItems[index].mrp = returnableItem.mrp;
        updatedItems[index].expiryDate = returnableItem.expiryDate;
      }
    }

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
          mrp: 0,
          discount: 0,
          gstPercentage: 0,
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
        const itemDiscount = (itemTotal * item.discount) / 100;
        const amountAfterDiscount = itemTotal - itemDiscount;
        const itemGST = (amountAfterDiscount * item.gstPercentage) / 100;

        totalAmount += itemTotal;
        totalDiscount += itemDiscount;
        totalGST += itemGST;
      }
    });

    const netAmount = totalAmount - totalDiscount + totalGST;

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
      const response = await axios.post(`${API_BASE_URL}/api/purchase-returns/create`, formData);
      setSuccess('Purchase return bill created successfully!');
      setError('');
      
      // Download PDF
      if (response.data.pdfUrl) {
        const pdfUrl = `${API_BASE_URL}/api/purchase-returns${response.data.pdfUrl}`;
        window.open(pdfUrl, '_blank');
      }
      
      // Reset form
      setFormData({
        ...formData,
        receiptNumber: '',
        supplierGST: '',
        items: [
          {
            itemName: '',
            batch: '',
            quantity: 0,
            purchaseRate: 0,
            mrp: 0,
            discount: 0,
            gstPercentage: 0,
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
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Create Purchase Return Bill</h1>
          
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Receipt Number</label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Supplier Name</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
                    list="suppliersList"
                    required
                  />
                  <datalist id="suppliersList">
                    {suppliers.map((supplier, index) => (
                      <option key={index} value={supplier.name} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={handleLoadBills}
                    disabled={loading || !formData.supplierName}
                    className="px-6 py-3 text-lg bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {loading ? 'Loading...' : 'Load Bills'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Supplier GST</label>
                <input
                  type="text"
                  name="supplierGST"
                  value={formData.supplierGST}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Items</h2>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="px-6 py-3 text-lg bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!isBillsLoaded}
                >
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[15%]">Item Name</th>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[10%]">Batch</th>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[10%]">Quantity</th>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[10%]">Returnable Qty</th>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[10%]">Purchase Rate</th>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[10%]">MRP</th>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[10%]">Discount %</th>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[10%]">GST %</th>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[10%]">Expiry Date</th>
                      <th className="px-6 py-4 text-left text-lg font-medium text-gray-500 uppercase tracking-wider w-[5%]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            name="itemName"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md font-medium"
                            required
                            disabled={!isBillsLoaded}
                            placeholder="Enter item name"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            name="batch"
                            value={item.batch}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md font-medium"
                            required
                            disabled={!item.itemName}
                          >
                            <option value="">Select Batch</option>
                            {returnableItems
                              .filter(ri => ri.itemName.toLowerCase() === item.itemName.toLowerCase())
                              .map((returnableItem, idx) => (
                                <option key={idx} value={returnableItem.batch}>
                                  {returnableItem.batch}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md font-medium"
                            min="1"
                            max={item.returnableQuantity}
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.returnableQuantity}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md bg-gray-100 font-medium"
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="purchaseRate"
                            value={item.purchaseRate}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md font-medium"
                            min="0"
                            step="0.01"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="mrp"
                            value={item.mrp}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md font-medium"
                            min="0"
                            step="0.01"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="discount"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md font-medium"
                            min="0"
                            max="100"
                            step="0.01"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="gstPercentage"
                            value={item.gstPercentage}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md font-medium"
                            min="0"
                            max="100"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            name="expiryDate"
                            value={item.expiryDate}
                            onChange={(e) => handleItemChange(index, e)}
                            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md font-medium"
                            required
                            disabled={!item.batch}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="text-red-600 hover:text-red-900 text-lg font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Total Amount</label>
                <input
                  type="number"
                  value={calculations.totalAmount.toFixed(2)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Total Discount</label>
                <input
                  type="number"
                  value={calculations.totalDiscount.toFixed(2)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Total GST</label>
                <input
                  type="number"
                  value={calculations.totalGST.toFixed(2)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">Net Amount</label>
                <input
                  type="number"
                  value={calculations.netAmount.toFixed(2)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 text-lg bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Return Bill'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturnForm; 