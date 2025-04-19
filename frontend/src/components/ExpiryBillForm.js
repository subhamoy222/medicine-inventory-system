import React, { useState } from 'react';

function ExpiryBillForm() {
  const [medicineName, setMedicineName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Expiry Bill Submitted', { medicineName, expiryDate, quantity });
  };

  return (
    <div className="expiry-bill-form">
      <h1 className="text-center text-2xl font-bold mb-6">Expiry Bill Form</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Medicine Name:</label>
          <input
            type="text"
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            className="border rounded w-full px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Expiry Date:</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="border rounded w-full px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border rounded w-full px-3 py-2"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Submit Expiry Bill
        </button>
      </form>
    </div>
  );
}

export default ExpiryBillForm;
