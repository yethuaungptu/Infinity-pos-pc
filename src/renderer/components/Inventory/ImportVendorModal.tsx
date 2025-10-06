import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Product } from '../../types/core';

interface ImportItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

interface ImportVendorModalProps {
  showModal: boolean;
  vendors: any[];
  selectedVendor: string;
  vendorProducts: Product[];
  importItems: ImportItem[];
  purchaseOrderNotes: string;
  shippingFee: number;
  onClose: () => void;
  onVendorSelect: (vendorId: string) => void;
  onAddItem: (product: Product) => void;
  onUpdateItem: (
    productId: string,
    field: 'quantity' | 'unitCost',
    value: number,
  ) => void;
  onRemoveItem: (productId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  setPurchaseOrderNotes: (notes: string) => void;
  setShippingFee: (fee: number) => void;
}

const ImportVendorModal: React.FC<ImportVendorModalProps> = ({
  showModal,
  vendors,
  selectedVendor,
  vendorProducts,
  importItems,
  purchaseOrderNotes,
  shippingFee,
  onClose,
  onVendorSelect,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onSubmit,
  setPurchaseOrderNotes,
  setShippingFee,
}) => {
  if (!showModal) return null;

  const subtotal = importItems.reduce((sum, item) => sum + item.totalCost, 0);
  //   const tax = subtotal * 0.08;
  const total = subtotal + (shippingFee || 0);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-[90%] max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Create Purchase Order
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Vendor Selection - SINGLE VENDOR ONLY */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Each purchase order is for ONE vendor
                  only. Select a vendor to see their products.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Vendor *
            </label>
            <select
              value={selectedVendor}
              onChange={(e) => onVendorSelect(e.target.value)}
              className=" border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              required
              disabled={importItems.length > 0}
            >
              <option value="">Choose a vendor...</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.companyName} - {vendor.contactPerson}
                </option>
              ))}
            </select>
            {importItems.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Vendor is locked after adding items. Clear items to change
                vendor.
              </p>
            )}
          </div>

          {/* Available Products - Shows products where this vendor is the PRIMARY vendor */}
          {selectedVendor && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Available Products from{' '}
                {vendors.find((v) => v.id === selectedVendor)?.companyName}
              </h4>
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {vendorProducts.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Product
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          SKU
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Current Stock
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Cost Price
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendorProducts.map((product) => {
                        const isAdded = importItems.some(
                          (item) => item.productId === product.id,
                        );
                        return (
                          <tr
                            key={product.id}
                            className={`hover:bg-gray-50 ${isAdded ? 'bg-green-50' : ''}`}
                          >
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {product.sku}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`${product.stock <= product.minimumStock ? 'text-red-600 font-semibold' : 'text-gray-900'}`}
                              >
                                {product.stock} {product.unit}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {product.costPrice} MMK
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => onAddItem(product)}
                                className={`text-sm font-medium ${isAdded ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900'}`}
                                disabled={isAdded}
                              >
                                {isAdded ? '✓ Added' : '+ Add'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">
                      No products available from this vendor
                    </p>
                    <p className="text-sm">
                      Products must have this vendor set as their primary vendor
                      to appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Purchase Order Items */}
          {importItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Purchase Order Items ({importItems.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all items from this order?')) {
                      importItems.forEach((item) =>
                        onRemoveItem(item.productId),
                      );
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        SKU
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Unit Cost
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Remove
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importItems.map((item) => (
                      <tr key={item.productId}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.productSku}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              onUpdateItem(
                                item.productId,
                                'quantity',
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) =>
                              onUpdateItem(
                                item.productId,
                                'unitCost',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.totalCost.toLocaleString()} MMK
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.productId)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove item"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Summary */}
              <div className="mt-4 bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {subtotal.toLocaleString()} MMK
                  </span>
                </div>
                {/* <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Tax (8%):</span>
                  <span className="font-medium text-gray-900">
                    {tax.toLocaleString()} MMK
                  </span>
                </div> */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Shipping Fee:</span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={shippingFee || ''}
                      onChange={(e) =>
                        setShippingFee(parseFloat(e.target.value) || 0)
                      }
                      className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <span className="ml-2 text-sm text-gray-600">MMK</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="text-base font-semibold text-gray-900">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {total.toLocaleString()} MMK
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Notes (Optional)
            </label>
            <textarea
              value={purchaseOrderNotes}
              onChange={(e) => setPurchaseOrderNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Special instructions, expected delivery date, payment terms, etc..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importItems.length === 0 || !selectedVendor}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              Create Purchase Order ({importItems.length} items)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportVendorModal;
