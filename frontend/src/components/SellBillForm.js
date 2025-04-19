import React, { useState, useEffect, useCallback, useReducer } from "react";
import jsPDF from "jspdf";

// Custom hook for managing items
const useItems = (initialGstNumber) => {
  // Initial state
  const initialState = [
    {
      itemName: "",
      batch: "",
      batchOptions: [],
      availableQuantity: 0,
      quantity: "",
      mrp: "",
      discount: "",
      amount: "",
      gstNo: initialGstNumber
    }
  ];

  // Reducer for items state
  const itemsReducer = (state, action) => {
    switch (action.type) {
      case 'UPDATE_ITEM':
        return state.map((item, index) => 
          index === action.index ? { ...item, ...action.payload } : item
        );
      
      case 'ADD_ITEM':
        return [
          ...state,
          {
            itemName: "",
            batch: "",
            batchOptions: [],
            availableQuantity: 0,
            quantity: "",
            mrp: "",
            discount: "",
            amount: "",
            gstNo: initialGstNumber
          }
        ];
      
      case 'RESET_ITEMS':
        return [{
          itemName: "",
          batch: "",
          batchOptions: [],
          availableQuantity: 0,
          quantity: "",
          mrp: "",
          discount: "",
          amount: "",
          gstNo: initialGstNumber
        }];
      
      case 'UPDATE_ALL_GST':
        return state.map(item => ({
          ...item,
          gstNo: action.payload
        }));
      
      default:
        return state;
    }
  };

  const [items, dispatch] = useReducer(itemsReducer, initialState);

  // Update all items' GST number when it changes
  useEffect(() => {
    dispatch({ type: 'UPDATE_ALL_GST', payload: initialGstNumber });
  }, [initialGstNumber]);

  // Helper functions
  const updateItem = (index, payload) => {
    dispatch({ type: 'UPDATE_ITEM', index, payload });
  };

  const addItem = () => {
    dispatch({ type: 'ADD_ITEM' });
  };

  const resetItems = () => {
    dispatch({ type: 'RESET_ITEMS' });
  };

  return { items, updateItem, addItem, resetItems };
};

const SellBillForm = () => {
  const [sellDetails, setSellDetails] = useState({
    saleInvoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    receiptNumber: "",
    partyName: "",
    email: "",
    gstNumber: "",
  });

  // Remove the lastInvoiceNumber state since we'll get it from the server
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);

  // Use the custom hook for items management
  const { items, updateItem, addItem, resetItems } = useItems(sellDetails.gstNumber);

  // Fetch the next invoice number when component mounts
  useEffect(() => {
    const fetchNextInvoiceNumber = async () => {
      try {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        
        console.log('Fetching next invoice number with token:', token);
        console.log('User email:', email);
        
        const response = await fetch('https://medicine-inventory-system.onrender.com/api/bills/next-invoice-number', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch next invoice number');
        }

        setSellDetails(prev => ({
          ...prev,
          saleInvoiceNumber: data.invoiceNumber,
          date: new Date().toISOString().split("T")[0],
          receiptNumber: "",
          partyName: "",
          email: "",
          gstNumber: "",
        }));
      } catch (error) {
        console.error('Error fetching next invoice number:', error);
        setMessage(error.message);
        setSellDetails(prev => ({
          ...prev,
          saleInvoiceNumber: "INV001",
          date: new Date().toISOString().split("T")[0],
          receiptNumber: "",
          partyName: "",
          email: "",
          gstNumber: "",
        }));
      }
    };

    fetchNextInvoiceNumber();
  }, []);

  // Function to generate next invoice number
  const generateNextInvoiceNumber = async () => {
    try {
      const token = localStorage.getItem("token");
      const email = localStorage.getItem("email");
      
      console.log("Generating next invoice number with:", { token, email });
      
      const response = await fetch("https://medicine-inventory-system.onrender.com/api/bills/next-invoice-number", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email })
      });
      
      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);
      
      if (response.ok) {
        return responseData.invoiceNumber;
      } else {
        setMessage(`Error generating next invoice number: ${responseData.message || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error("Error in generateNextInvoiceNumber:", error);
      setMessage(`Error generating next invoice number: ${error.message}`);
      return null;
    }
  };

  // Reset function to also handle invoice number generation
  const resetForm = async () => {
    const nextInvoiceNumber = await generateNextInvoiceNumber();
    if (nextInvoiceNumber) {
      setSellDetails(prev => ({
        ...prev,
        saleInvoiceNumber: nextInvoiceNumber,
        receiptNumber: "",
        partyName: "",
        email: "",
        gstNumber: "",
        date: new Date().toISOString().split("T")[0],
      }));
    }
  };

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Fetch inventory data with debounce
  const fetchInventoryData = useCallback(
    debounce(async (itemName, email, index) => {
      if (!itemName || !email) return;
      
      setSearchLoading(true);
      try {
        const response = await fetch(
          `https://medicine-inventory-system.onrender.com/api/inventory?itemName=${encodeURIComponent(
            itemName.toLowerCase()
          )}&email=${encodeURIComponent(email)}`
        );
        const data = await response.json();
        
        if (data.length > 0) {
          setSearchResults(data);
          setShowAutocomplete(true);
          
          // Update the current item with the first result
          const batchOptions = data.map((batch) => ({
            batchNumber: batch.batch.replace(/[^a-zA-Z0-9]/g, ''),
            quantity: batch.quantity,
            mrp: batch.mrp,
            gstNo: sellDetails.gstNumber
          }));
          
          const sanitizedBatch = data[0].batch.replace(/[^a-zA-Z0-9]/g, '');
          
          updateItem(index, {
            batchOptions,
            batch: sanitizedBatch,
            availableQuantity: data[0].quantity,
            mrp: data[0].mrp?.toString() || "",
          });
          
          setMessage("");
        } else {
          setSearchResults([]);
          setShowAutocomplete(false);
          setMessage(`No inventory found for ${itemName}`);
          
          // Reset the current item
          updateItem(index, {
            batchOptions: [],
            batch: "",
            availableQuantity: 0,
            mrp: "",
          });
        }
      } catch (error) {
        setMessage("Error fetching inventory data");
        setSearchResults([]);
        setShowAutocomplete(false);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    [sellDetails.gstNumber, updateItem]
  );

  const handleItemChange = (index, event) => {
    const { name, value } = event.target;
    const email = localStorage.getItem("email");
    
    // Handle item name change with debounced search
    if (name === "itemName") {
      updateItem(index, { itemName: value });
      
      if (value && email) {
        setActiveItemIndex(index);
        fetchInventoryData(value, email, index);
      } else {
        setShowAutocomplete(false);
      }
      return;
    }
    
    // Handle batch selection
    if (name === "batch") {
      const currentItem = items[index];
      const cleanBatch = value.replace(/[^a-zA-Z0-9]/g, '');
      const selectedBatch = currentItem.batchOptions.find(
        (batch) => batch.batchNumber === cleanBatch
      );
      
      if (selectedBatch) {
        updateItem(index, {
          batch: cleanBatch,
          availableQuantity: selectedBatch.quantity,
          mrp: selectedBatch.mrp?.toString() || "",
        });
      }
      return;
    }
    
    // Handle quantity, discount, and other fields
    updateItem(index, { [name]: value });
    
    // Calculate amount if quantity, mrp, and discount are available
    const currentItem = items[index];
    const quantity = parseFloat(currentItem.quantity) || 0;
    const mrp = parseFloat(currentItem.mrp) || 0;
    const discount = parseFloat(currentItem.discount) || 0;
    
    if (quantity > currentItem.availableQuantity) {
      setMessage(`Insufficient stock for ${currentItem.itemName}`);
    } else if (quantity <= 0) {
      setMessage("Quantity must be greater than 0");
    } else {
      const itemAmount = quantity * mrp;
      const discountedAmount = itemAmount - (itemAmount * discount) / 100;
      updateItem(index, { amount: discountedAmount.toFixed(2) });
      setMessage("");
    }
  };

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;
    // Prevent changing invoice number
    if (name === 'saleInvoiceNumber') return;
    setSellDetails({ ...sellDetails, [name]: value });
  };
  
  // Handle autocomplete selection
  const handleAutocompleteSelect = (itemName) => {
    if (activeItemIndex !== null) {
      updateItem(activeItemIndex, { itemName });
      setShowAutocomplete(false);
    }
  };
  
  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAutocomplete(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`GSTIN: ${sellDetails.gstNumber}`, 10, 10);
    doc.text(`Invoice Number: ${sellDetails.saleInvoiceNumber}`, 10, 20);
    
    const headers = [
      "Item Name",
      "Batch",
      "Qty",
      "MRP",
      "Discount%",
      "Amount"
    ];

    let y = 40;
    headers.forEach((header, i) => {
      doc.text(header, 10 + i * 35, y);
    });

    items.forEach((item) => {
      y += 10;
      [
        item.itemName,
        item.batch,
        item.quantity,
        item.mrp,
        item.discount,
        item.amount
      ].forEach((value, i) => {
        doc.text(String(value || "-"), 10 + i * 35, y);
      });
    });

    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 10, y + 20);
    
    doc.save("invoice.pdf");
  };

  const createSellBill = async () => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    if (!sellDetails.gstNumber) {
      setMessage("GST Number is required");
      return;
    }

    const gstMismatch = items.some(item => item.gstNo !== sellDetails.gstNumber);
    if (gstMismatch) {
      setMessage("All items must have the same GST Number");
      return;
    }

    const invalidQuantities = items.some(item => 
      item.availableQuantity < Number(item.quantity) || 
      Number(item.quantity) <= 0
    );

    if (invalidQuantities) {
      setMessage("Invalid quantities detected");
      return;
    }

    const body = {
      ...sellDetails,
      items: items.map(({ batchOptions, availableQuantity, ...rest }) => ({
        ...rest,
        quantity: Number(rest.quantity),
        mrp: Number(rest.mrp),
        discount: Number(rest.discount),
        gstNo: rest.gstNo
      })),
      email
    };

    try {
      setLoading(true);
      const response = await fetch("https://medicine-inventory-system.onrender.com/api/bills/sale", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (response.ok) {
        setMessage("Invoice created successfully!");
        generatePDF();
        resetItems();
        resetForm(); // Use the new reset function
      } else {
        setMessage(responseData.message || "Failed to create invoice");
      }
    } catch (error) {
      setMessage("Error creating invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-indigo-600 mb-2">Create Sales Invoice</h2>
          <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input
                type="text"
                name="gstNumber"
                placeholder="Enter GST Number"
                className="rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                value={sellDetails.gstNumber}
                onChange={handleDetailsChange}
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Party Name</label>
              <input
                type="text"
                name="partyName"
                placeholder="Enter Party Name"
                className="rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                value={sellDetails.partyName}
                onChange={handleDetailsChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  name="saleInvoiceNumber"
                  value={sellDetails.saleInvoiceNumber}
                  className="rounded-lg border-2 border-indigo-100 bg-gray-100 p-3 transition-colors"
                  readOnly
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  className="rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                  value={sellDetails.date}
                  onChange={handleDetailsChange}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
              <input
                type="text"
                name="receiptNumber"
                placeholder="Receipt #"
                className="rounded-lg border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 transition-colors"
                value={sellDetails.receiptNumber}
                onChange={handleDetailsChange}
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-indigo-600 mb-4">Item Details</h3>
          <div className="rounded-xl border-2 border-indigo-50 ">
            <table className="w-full">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  {["Item Name", "Batch", "Available", "Qty", "MRP", "Discount%", "GST No", "Amount"].map((header, idx) => (
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
                {items.map((item, index) => (
                  <tr 
                    key={index}
                    className="hover:bg-indigo-50 transition-colors"
                  >
                    <td className="px-4 py-3 relative">
                      <input
                        type="text"
                        name="itemName"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveItemIndex(index);
                          if (item.itemName) {
                            setShowAutocomplete(true);
                          }
                        }}
                      />
                      {showAutocomplete && activeItemIndex === index && (
                        <div 
                          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {searchLoading ? (
                            <div className="p-2 text-center text-gray-500">
                              <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <ul>
                              {searchResults.map((result, idx) => (
                                <li 
                                  key={idx}
                                  className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                                  onClick={() => handleAutocompleteSelect(result.itemName)}
                                >
                                  {result.itemName}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-2 text-center text-gray-500">
                              No results found
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        name="batch"
                        value={item.batch}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="">Select Batch</option>
                        {item.batchOptions.map((batch, idx) => (
                          <option key={idx} value={batch.batchNumber}>
                            {batch.batchNumber.replace(/[^a-zA-Z0-9]/g, '')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.availableQuantity?.toString() ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        name="mrp"
                        value={item.mrp}
                        disabled
                        className="w-full rounded-md bg-indigo-50 border-indigo-100"
                      />
                    </td>
                    
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        name="discount"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, e)}
                        className="w-full rounded-md border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        name="gstNo"
                        value={sellDetails.gstNumber}
                        readOnly
                        className="w-full rounded-md bg-indigo-50 border-indigo-100"
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

        <div className="flex justify-between items-center">
          <button
            onClick={addItem}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Item
          </button>

          <div className="space-x-4">
            {message && (
              <div className="inline-flex items-center bg-rose-100 text-rose-700 px-4 py-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {message}
              </div>
            )}
           
            
            <button
              onClick={createSellBill}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
              disabled={loading}
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
                "Create Sales Invoice"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellBillForm;
