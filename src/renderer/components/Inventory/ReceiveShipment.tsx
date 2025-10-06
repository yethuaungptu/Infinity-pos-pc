import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { Transaction } from '../../types/core';

interface ReceiveItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityToReceive: number;
  unitCost: number;
  currentStock: number;
  items: any[];
  unit: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendor: any;
  subtotal: number;
  status: string;
  total: number;
}

interface ReceiveShipmentProps {
  orderId: string;
  onBack: () => void;
  onDataChanged?: () => void;
}

const ReceiveShipment: React.FC<ReceiveShipmentProps> = ({
  orderId,
  onBack,
  onDataChanged,
}) => {
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [items, setItems] = useState<ReceiveItem[]>([]);
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderData = await window.api.getPurchaseDetail(orderId);
        setOrder(orderData);
        const itemsWithStock = await Promise.all(
          orderData.items.map(async (item: any) => {
            const product = await window.api.getProductDetail(item.productId);
            return {
              ...item,
              quantityToReceive: item.quantityOrdered - item.quantityReceived,
              currentStock: product.stock,
              unit: product.unit || 'pcs',
            };
          }),
        );

        setItems(itemsWithStock);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const updateQuantity = (itemId: string, value: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const maxReceivable = item.quantityOrdered - item.quantityReceived;
          const newValue = Math.max(0, Math.min(value, maxReceivable));
          return { ...item, quantityToReceive: newValue };
        }
        return item;
      }),
    );
  };

  const setAllToMax = () => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        quantityToReceive: item.quantityOrdered - item.quantityReceived,
      })),
    );
  };

  const clearAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, quantityToReceive: 0 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToReceive = items.filter((item) => item.quantityToReceive > 0);

    if (itemsToReceive.length === 0) {
      alert('Please enter quantities to receive');
      return;
    }

    try {
      const isReceived = itemsToReceive.every(
        (item) =>
          item.quantityReceived + item.quantityToReceive ===
          item.quantityOrdered,
      );
      const updatePurchase = {
        id: orderId,
        receivedDate: new Date(receivedDate),
        items: {
          update: itemsToReceive.map((item) => ({
            where: { id: item.id },
            data: {
              quantityReceived: item.quantityReceived + item.quantityToReceive,
            },
          })),
        },
        notes,
        status: isReceived ? 'RECEIVED' : 'PARTIAL_RECEIVED',
      };
      await window.api.updatePurchase(updatePurchase);
      for (const item of itemsToReceive) {
        await window.api.updateProductData({
          id: item.productId,
          stock: item.currentStock + item.quantityToReceive,
        });
      }
      if (order && isReceived) {
        await window.api.incrementVendorCredit(order.vendor.id, order.total);
        const staff: any = await window.api.check();
        const transactionId = `TXN_${Date.now()}`;
        let cart: any = [];
        items.map((item) =>
          cart.push({
            product: {
              connect: { id: item.productId },
            },
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantityOrdered,
            unit: item.unit,
            unitPrice: item.unitCost,
            total: item.unitCost * item.quantityOrdered,
          }),
        );
        const transaction: Transaction = {
          id: transactionId,
          receiptNumber: `RCP-${Date.now()}`,
          type: 'PURCHASE',
          vendorId: order.vendor.id,
          items: { create: [...cart] },
          subtotal: order.subtotal,
          tax: 0,
          discount: 0,
          total: order.total,
          paymentMethod: 'CREDIT',
          paidAmount: 0,
          balanceAmount: order.total,
          status: 'COMPLETED',
          staffId: staff.id,
          timestamp: new Date(),
          synced: false,
        };
        await window.api.createTransactionData(transaction);
        if (typeof onDataChanged === 'function') {
          onDataChanged();
        }
      }

      alert('Shipment received successfully! Product stock has been updated.');
      onBack();
    } catch (error) {
      console.error('Error receiving shipment:', error);
      alert('Failed to receive shipment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">Order not found</div>
      </div>
    );
  }

  const totalToReceive = items.reduce(
    (sum, item) => sum + item.quantityToReceive,
    0,
  );
  const allItemsFullyReceived = items.every(
    (item) =>
      item.quantityReceived + item.quantityToReceive === item.quantityOrdered,
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Receive Shipment
              </h1>
              <p className="text-gray-600">
                Order #{order.orderNumber} from {order.vendor.companyName}
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <p className="text-sm text-blue-900 font-medium">
                  Update inventory quantities as items arrive
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Enter the quantity received for each item. Product stock will
                  be automatically updated.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Received Date
                  </label>
                  <input
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div className="pt-6">
                  <span className="text-sm text-gray-600">
                    Receiving {totalToReceive} items
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={setAllToMax}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
                >
                  Receive All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200 overflow-x-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Ordered
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Already Received
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Receive Now
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    New Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const willBeComplete =
                    item.quantityReceived + item.quantityToReceive ===
                    item.quantityOrdered;
                  const newStock = item.currentStock + item.quantityToReceive;
                  const remaining =
                    item.quantityOrdered - item.quantityReceived;

                  return (
                    <tr
                      key={item.id}
                      className={
                        item.quantityToReceive > 0 ? 'bg-green-50' : ''
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.productName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.productSku}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {item.currentStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-900">
                          {item.quantityOrdered}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-orange-600 font-medium">
                          {item.quantityReceived}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={item.quantityToReceive}
                          onChange={(e) =>
                            updateQuantity(
                              item.id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-center text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          max: {remaining}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`text-sm font-medium ${item.quantityToReceive > 0 ? 'text-green-600' : 'text-gray-900'}`}
                        >
                          {newStock}
                        </span>
                        {item.quantityToReceive > 0 && (
                          <div className="text-xs text-green-600">
                            +{item.quantityToReceive}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {willBeComplete ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Complete
                          </span>
                        ) : item.quantityToReceive > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Partial
                          </span>
                        ) : item.quantityReceived > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Started
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receiving Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Condition of items, any damages, delivery notes, etc..."
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Shipment Summary
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Receiving{' '}
                    <span className="font-semibold text-gray-900">
                      {totalToReceive}
                    </span>{' '}
                    items
                  </p>
                  <p className="text-gray-600">
                    {allItemsFullyReceived ? (
                      <span className="text-green-600 font-medium">
                        ✓ All items will be fully received
                      </span>
                    ) : (
                      <span className="text-orange-600 font-medium">
                        ⚠ Partial shipment
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-2">Order Status</p>
                <p className="text-lg font-bold text-blue-600">
                  {allItemsFullyReceived ? 'RECEIVED' : 'PARTIAL_RECEIVED'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={totalToReceive === 0}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              Confirm Receipt ({totalToReceive} items)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiveShipment;
