
// import React, { useState } from "react";
// import jsPDF from "jspdf";

// const PurchaseBillForm = () => {
//   const [items, setItems] = useState([
//     {
//       itemName: "",
//       batch: "",
//       expiryDate: "",
//       pack: "",
//       quantity: "",
//       purchaseRate: "",
//       mrp: "",
//       gstPercentage: "",
//       discount: "",
//       amount: "",
//     },
//   ]);

//   const [purchaseDetails, setPurchaseDetails] = useState({
//     supplierInvoiceNumber: "",
//     receiptNumber: "",
//     partyName: "",
//     date: "",
//   });

//   const [message, setMessage] = useState("");

//   const handleItemChange = (index, event) => {
//     const { name, value } = event.target;
//     const updatedItems = [...items];
//     updatedItems[index][name] = value;

//     const quantity = parseFloat(updatedItems[index].quantity || 0);
//     const purchaseRate = parseFloat(updatedItems[index].purchaseRate || 0);
//     const discount = parseFloat(updatedItems[index].discount || 0);

//     updatedItems[index].amount = ((quantity * purchaseRate) - discount).toFixed(2);
//     setItems(updatedItems);
//   };

//   const handleDetailsChange = (event) => {
//     const { name, value } = event.target;
//     setPurchaseDetails({ ...purchaseDetails, [name]: value });
//   };

//   const addItem = () => {
//     setItems([
//       ...items,
//       {
//         itemName: "",
//         batch: "",
//         expiryDate: "",
//         pack: "",
//         quantity: "",
//         purchaseRate: "",
//         mrp: "",
//         gstPercentage: "",
//         discount: "",
//         amount: "",
//       },
//     ]);
//   };

//   const generatePDF = () => {
//     const doc = new jsPDF({ orientation: "landscape" });
//     doc.setFontSize(10);
//     doc.text("Purchase Bill", 14, 10);

//     const headers = [
//       "Item Name",
//       "Batch",
//       "Expiry Date",
//       "Pack",
//       "Quantity",
//       "Purchase Rate",
//       "MRP",
//       "GST (%)",
//       "Discount",
//       "Amount",
//     ];

//     let y = 30;
//     headers.forEach((header, index) => {
//       doc.text(header, 10 + index * 25, y);
//     });

//     // Add rows for each item
//     items.forEach((item) => {
//       y += 10;
//       Object.values(item).forEach((value, colIndex) => {
//         doc.text(value || "-", 10 + colIndex * 25, y);
//       });
//     });

//     // Add Total Amount at the bottom of the table
//     const totalAmount = items.reduce(
//       (sum, item) => sum + parseFloat(item.amount || 0),
//       0
//     ).toFixed(2);

//     y += 10;
//     doc.text("Total Amount", 10, y);
//     doc.text(totalAmount, 180, y); // Adjusted position for the total amount text

//     doc.save("PurchaseBill.pdf");
//   };

//   const createPurchaseBill = async () => {
//     const email = localStorage.getItem("email");
//     const token = localStorage.getItem("token");

//     if (!email || !token) {
//       setMessage("User is not authenticated. Please log in again.");
//       return;
//     }

//     const purchaseAmount = items.reduce(
//       (sum, item) => sum + parseFloat(item.amount || 0),
//       0
//     );
//     const totalAmount = purchaseAmount;
//     const discountAmount = items.reduce(
//       (sum, item) => sum + parseFloat(item.discount || 0),
//       0
//     );

//     const body = {
//       ...purchaseDetails,
//       purchaseAmount,
//       totalAmount,
//       discountAmount,
//       email,
//       items: items.map((item) => ({
//         ...item,
//         quantity: parseFloat(item.quantity || 0),
//       })),
//     };

//     try {
//       const response = await fetch("http://localhost:5000/api/bills/purchase", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${token}`, // Ensure token is sent in the header
//         },
//         body: JSON.stringify(body),
//       });

//       if (response.ok) {
//         setMessage("Purchase bill created and inventory updated successfully!");
//         generatePDF(); // Generate PDF after success
//       } else {
//         const errorData = await response.json();
//         setMessage(
//           `Failed to create purchase bill: ${errorData.message || "Unknown error"}`
//         );
//       }
//     } catch (error) {
//       setMessage(`Error occurred while creating the purchase bill: ${error.message}`);
//     }
//   };

//   // Calculate total amount
//   const totalAmount = items.reduce(
//     (sum, item) => sum + parseFloat(item.amount || 0),
//     0
//   ).toFixed(2);

//   return (
//     <div className="container mx-auto p-6 bg-gray-100 shadow-md rounded-lg">
//       <h2 className="text-2xl font-bold mb-6">Create Purchase Bill</h2>

//       <div className="grid grid-cols-2 gap-4 mb-6">
//         <input
//           type="text"
//           name="supplierInvoiceNumber"
//           placeholder="Supplier Invoice Number"
//           value={purchaseDetails.supplierInvoiceNumber}
//           onChange={handleDetailsChange}
//           className="border border-gray-300 p-2 rounded w-full"
//         />
//         <input
//           type="text"
//           name="receiptNumber"
//           placeholder="Receipt Number"
//           value={purchaseDetails.receiptNumber}
//           onChange={handleDetailsChange}
//           className="border border-gray-300 p-2 rounded w-full"
//         />
//         <input
//           type="text"
//           name="partyName"
//           placeholder="Party Name"
//           value={purchaseDetails.partyName}
//           onChange={handleDetailsChange}
//           className="border border-gray-300 p-2 rounded w-full"
//         />
//         <input
//           type="date"
//           name="date"
//           value={purchaseDetails.date}
//           onChange={handleDetailsChange}
//           className="border border-gray-300 p-2 rounded w-full"
//         />
//       </div>

//       <div className="overflow-auto">
//         <table className="table-auto w-full border-collapse border border-gray-300 mb-4">
//           <thead>
//             <tr className="bg-gray-200">
//               {[
//                 "Item Name",
//                 "Batch",
//                 "Expiry Date",
//                 "Pack",
//                 "Quantity",
//                 "Purchase Rate",
//                 "MRP",
//                 "GST (%)",
//                 "Discount",
//                 "Amount",
//               ].map((header, index) => (
//                 <th key={index} className="border border-gray-300 p-2">
//                   {header}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((item, rowIndex) => (
//               <tr key={rowIndex} className="bg-white">
//                 {Object.keys(item).map((field, colIndex) => (
//                   <td key={colIndex} className="border border-gray-300 p-2">
//                     <input
//                       type={
//                         ["quantity", "purchaseRate", "discount", "amount"].includes(field)
//                           ? "number"
//                           : field === "expiryDate"
//                           ? "date"
//                           : "text"
//                       }
//                       name={field}
//                       value={item[field]}
//                       onChange={(e) => handleItemChange(rowIndex, e)}
//                       placeholder={field}
//                       className="w-full p-1 border border-gray-300 rounded"
//                       readOnly={field === "amount"}
//                     />
//                   </td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//           <tfoot>
//             <tr className="bg-gray-200">
//               <td colSpan="9" className="border border-gray-300 p-2 text-right font-bold">
//                 Total Amount
//               </td>
//               <td className="border border-gray-300 p-2 text-right font-bold">
//                 {totalAmount}
//               </td>
//             </tr>
//           </tfoot>
//         </table>
//       </div>

//       <div className="flex justify-between">
//         <button
//           onClick={addItem}
//           className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
//         >
//           Add Item
//         </button>
//         <button
//           onClick={createPurchaseBill}
//           className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
//         >
//           Create Purchase Bill
//         </button>
//       </div>

//       {message && (
//         <p className="mt-4 text-center text-red-500 font-semibold">{message}</p>
//       )}
//     </div>
//   );
// };

//export default PurchaseBillForm;


import React, { useState } from "react";
import jsPDF from "jspdf";

const PurchaseBillForm = () => {
  const [items, setItems] = useState([
    {
      itemName: "",
      batch: "",
      expiryDate: "",
      pack: "",
      quantity: "",
      purchaseRate: "",
      mrp: "",
      gstPercentage: "",
      discount: "",
      amount: "",
    },
  ]);

  const [purchaseDetails, setPurchaseDetails] = useState({
    supplierInvoiceNumber: "",
    receiptNumber: "",
    partyName: "",
    date: "",
  });

  const [message, setMessage] = useState("");

  const handleItemChange = (index, event) => {
    const { name, value } = event.target;
    const updatedItems = [...items];
    updatedItems[index][name] = value;

    const quantity = parseFloat(updatedItems[index].quantity || 0);
    const purchaseRate = parseFloat(updatedItems[index].purchaseRate || 0);
    const discount = parseFloat(updatedItems[index].discount || 0);

    updatedItems[index].amount = ((quantity * purchaseRate) - discount).toFixed(2);
    setItems(updatedItems);
  };

  const handleDetailsChange = (event) => {
    const { name, value } = event.target;
    setPurchaseDetails({ ...purchaseDetails, [name]: value });
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        itemName: "",
        batch: "",
        expiryDate: "",
        pack: "",
        quantity: "",
        purchaseRate: "",
        mrp: "",
        gstPercentage: "",
        discount: "",
        amount: "",
      },
    ]);
  };

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(10);
    doc.text("Purchase Bill", 14, 10);

    const headers = [
      "Item Name",
      "Batch",
      "Expiry Date",
      "Pack",
      "Quantity",
      "Purchase Rate",
      "MRP",
      "GST (%)",
      "Discount",
      "Amount",
    ];

    let y = 30;
    headers.forEach((header, index) => {
      doc.text(header, 10 + index * 25, y);
    });

    // Add rows for each item
    items.forEach((item) => {
      y += 10;
      Object.values(item).forEach((value, colIndex) => {
        doc.text(value || "-", 10 + colIndex * 25, y);
      });
    });

    // Add Total Amount at the bottom of the table
    const totalAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.amount || 0),
      0
    ).toFixed(2);

    y += 10;
    doc.text("Total Amount", 10, y);
    doc.text(totalAmount, 180, y); // Adjusted position for the total amount text

    doc.save("PurchaseBill.pdf");
  };

  const createPurchaseBill = async () => {
    const email = localStorage.getItem("email");
    const token = localStorage.getItem("token");

    if (!email || !token) {
      setMessage("User is not authenticated. Please log in again.");
      return;
    }

    const purchaseAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.amount || 0),
      0
    );
    const totalAmount = purchaseAmount;
    const discountAmount = items.reduce(
      (sum, item) => sum + parseFloat(item.discount || 0),
      0
    );

    const body = {
      ...purchaseDetails,
      purchaseAmount,
      totalAmount,
      discountAmount,
      email,
      items: items.map((item) => ({
        ...item,
        quantity: parseFloat(item.quantity || 0),
      })),
    };

    try {
      const response = await fetch("https://medicine-inventory-system.onrender.com/api/bills/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Ensure token is sent in the header
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setMessage("Purchase bill created and inventory updated successfully!");
        generatePDF(); // Generate PDF after success
      } else {
        const errorData = await response.json();
        setMessage(
          `Failed to create purchase bill: ${errorData.message || "Unknown error"}`
        );
      }
    } catch (error) {
      setMessage(`Error occurred while creating the purchase bill: ${error.message}`);
    }
  };

  // Calculate total amount
  const totalAmount = items.reduce(
    (sum, item) => sum + parseFloat(item.amount || 0),
    0
  ).toFixed(2);

  return (
    <div className="container mx-auto p-8 bg-gradient-to-r from-blue-50 via-white to-blue-50 shadow-2xl rounded-xl">
      <h2 className="text-4xl font-bold text-center text-blue-600 mb-10">
        Create Purchase Bill
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <input
          type="text"
          name="supplierInvoiceNumber"
          placeholder="Supplier Invoice Number"
          value={purchaseDetails.supplierInvoiceNumber}
          onChange={handleDetailsChange}
          className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
        />
        <input
          type="text"
          name="receiptNumber"
          placeholder="Receipt Number"
          value={purchaseDetails.receiptNumber}
          onChange={handleDetailsChange}
          className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
        />
        <input
          type="text"
          name="partyName"
          placeholder="Party Name"
          value={purchaseDetails.partyName}
          onChange={handleDetailsChange}
          className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
        />
        <input
          type="date"
          name="date"
          value={purchaseDetails.date}
          onChange={handleDetailsChange}
          className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
        />
      </div>

      <div className="overflow-auto mb-10">
        <table className="table-auto w-full text-sm shadow-lg border-collapse border border-gray-200">
          <thead className="bg-blue-100 text-blue-600">
            <tr>
              {[
                "Item Name",
                "Batch",
                "Expiry Date",
                "Pack",
                "Quantity",
                "Purchase Rate",
                "MRP",
                "GST (%)",
                "Discount",
                "Amount",
              ].map((header, index) => (
                <th
                  key={index}
                  className="border border-gray-300 p-3 text-left font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIndex) => (
              <tr key={rowIndex} className="bg-white hover:bg-gray-100">
                {Object.keys(item).map((field, colIndex) => (
                  <td key={colIndex} className="border border-gray-300 p-3">
                    <input
                      type={
                        ["quantity", "purchaseRate", "discount", "amount"].includes(field)
                          ? "number"
                          : field === "expiryDate"
                          ? "date"
                          : "text"
                      }
                      name={field}
                      value={item[field]}
                      onChange={(e) => handleItemChange(rowIndex, e)}
                      placeholder={field}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                      readOnly={field === "amount"}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-blue-50">
              <td colSpan="9" className="border border-gray-300 p-3 text-right font-bold text-blue-600">
                Total Amount
              </td>
              <td className="border border-gray-300 p-3 text-right font-bold text-blue-600">
                {totalAmount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-between gap-6">
        <button
          onClick={addItem}
          className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-shadow shadow-md"
        >
          Add Item
        </button>
        <button
          onClick={createPurchaseBill}
          className="bg-green-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-600 transition-shadow shadow-md"
        >
          Create Purchase Bill
        </button>
      </div>

      {message && (
        <p
          className={`mt-6 text-center font-semibold py-3 px-6 rounded-lg ${
            message.includes("successfully")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default PurchaseBillForm;
