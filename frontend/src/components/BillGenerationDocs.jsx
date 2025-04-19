import React from 'react';

const BillGenerationDocs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            Bill Generation Documentation
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive guide for creating and managing sales invoices
          </p>
        </div>

        {/* Overview Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">Overview</h2>
          <div className="space-y-4 text-gray-700 bg-blue-50 p-6 rounded-lg">
            <p>
              The Bill Generation module allows users to create professional sales invoices 
              with automatic calculations, inventory integration, and PDF generation 
              capabilities. Key features include:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Dynamic item addition with real-time inventory checks</li>
              <li>Automatic GST calculations and validations</li>
              <li>Batch-wise stock management</li>
              <li>Professional PDF invoice generation</li>
              <li>Historical data tracking</li>
            </ul>
          </div>
        </section>

        {/* Usage Guide */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">Step-by-Step Guide</h2>
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <h3 className="text-xl font-medium mb-2">1. Enter Party Details</h3>
              <p className="text-gray-600 mb-3">
                Start by filling in the mandatory fields:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium">GST Number:</span> 
                  <span className="text-gray-600 ml-2">Valid 15-digit GSTIN</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-medium">Party Name:</span> 
                  <span className="text-gray-600 ml-2">Customer/Company name</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <h3 className="text-xl font-medium mb-2">2. Add Items</h3>
              <div className="space-y-4">
                <div className="flex items-center bg-green-50 p-3 rounded">
                  <span className="mr-2">➤</span>
                  Search items from integrated inventory
                </div>
                <div className="flex items-center bg-green-50 p-3 rounded">
                  <span className="mr-2">➤</span>
                  Select batch and enter quantity
                </div>
                <div className="flex items-center bg-green-50 p-3 rounded">
                  <span className="mr-2">➤</span>
                  Automatic MRP and stock validation
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
              <h3 className="text-xl font-medium mb-2">3. Review & Generate</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Automatic Calculations</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Total Amount</li>
                    <li>• Discount Applications</li>
                    <li>• Net Payable Amount</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Output Options</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• PDF Generation</li>
                    <li>• Print Directly</li>
                    <li>• Email Receipt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specs */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">Technical Specifications</h2>
          <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-medium mb-2">API Endpoint</h3>
              <code className="bg-gray-100 p-2 rounded text-sm block">
                POST /api/bills/sale
              </code>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-medium mb-2">Request Body Example</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {`{
  "saleInvoiceNumber": "INV-2023-001",
  "date": "2023-08-15",
  "gstNumber": "27ABCDE1234F1Z5",
  "items": [
    {
      "itemName": "Paracetamol",
      "batch": "BATCH-001",
      "quantity": 100,
      "mrp": 10.50,
      "expiryDate": "2025-12-31"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold text-blue-500 mb-4">FAQ</h2>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium">Q: How to handle inventory mismatches?</h3>
              <p className="text-gray-600 mt-2">
                The system automatically validates stock levels in real-time. If you 
                encounter mismatches, refresh the inventory data or check batch 
                availability.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-medium">Q: Can I edit generated invoices?</h3>
              <p className="text-gray-600 mt-2">
                Once generated, invoices are immutable for audit purposes. Create a 
                credit note for adjustments.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>For additional support, contact our helpdesk at support@pharma-billing.com</p>
          <p className="mt-2">v2.1.0 | Updated: August 2023</p>
        </div>
      </div>
    </div>
  );
};

export default BillGenerationDocs;