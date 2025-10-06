import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendor?: any;
  orderDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  staff: any;
  status: 'PENDING' | 'ORDERED' | 'PARTIAL_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
  items: PurchaseOrderItem[];
}

interface PurchaseOrderListProps {
  onNavigateToReceiveShipment?: (orderId: string) => void;
}

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  onNavigateToReceiveShipment,
}) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await window.api.getPurchases();
        setOrders(ordersData);
        setFilteredOrders(ordersData);
      } catch (error) {
        console.error('Error fetching purchase orders:', error);
        setOrders([]);
        setFilteredOrders([]);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.vendor.companyName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ORDERED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PARTIAL_RECEIVED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="w-4 h-4" />;
      case 'ORDERED':
        return <TruckIcon className="w-4 h-4" />;
      case 'PARTIAL_RECEIVED':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'RECEIVED':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const openDetailModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    ordered: orders.filter((o) => o.status === 'ORDERED').length,
    received: orders.filter((o) => o.status === 'RECEIVED').length,
    totalValue: orders.reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Purchase Orders
            </h1>
            <p className="text-gray-600">
              Manage and track inventory purchase orders
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-gray-600">Total Orders</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </h3>
            <p className="text-gray-600">Pending</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-2xl font-bold text-blue-600">
              {stats.ordered}
            </h3>
            <p className="text-gray-600">Ordered</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-2xl font-bold text-green-600">
              {stats.received}
            </h3>
            <p className="text-gray-600">Received</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-2xl font-bold text-purple-600">
              {stats.totalValue.toLocaleString()}
            </h3>
            <p className="text-gray-600">Total Value (MMK)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIAL_RECEIVED">Partial Received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expected Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.vendor.companyName || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.expectedDate
                      ? new Date(order.expectedDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.items.length} items
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items.reduce(
                        (sum, item) => sum + item.quantityReceived,
                        0,
                      )}{' '}
                      /{' '}
                      {order.items.reduce(
                        (sum, item) => sum + item.quantityOrdered,
                        0,
                      )}{' '}
                      received
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.total.toLocaleString()} MMK
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="ml-1">
                        {order.status.replace('_', ' ')}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openDetailModal(order)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No purchase orders found
          </div>
        )}
      </div>

      {/* Detail Modal - Will be created as separate component */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-[90%] max-w-5xl shadow-lg rounded-md bg-white mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Purchase Order: {selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Vendor</p>
                <p className="font-medium">
                  {selectedOrder.vendor.companyName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}
                >
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium">
                  {new Date(selectedOrder.orderDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expected Date</p>
                <p className="font-medium">
                  {selectedOrder.expectedDate
                    ? new Date(selectedOrder.expectedDate).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Staff</p>
                <p className="font-medium">{selectedOrder.staff.username}</p>
              </div>
              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Order Items</h4>
              <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Ordered
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Received
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit Cost
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.productSku}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.quantityOrdered}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            item.quantityReceived === item.quantityOrdered
                              ? 'text-green-600 font-medium'
                              : 'text-orange-600 font-medium'
                          }
                        >
                          {item.quantityReceived}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.unitCost.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {item.totalCost.toLocaleString()} MMK
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Subtotal:</span>
                <span className="font-medium">
                  {selectedOrder.subtotal.toLocaleString()} MMK
                </span>
              </div>
              {selectedOrder.tax > 0 && (
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Tax:</span>
                  <span className="font-medium">
                    {selectedOrder.tax.toLocaleString()} MMK
                  </span>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span className="text-sm">Shipping:</span>
                <span className="font-medium">
                  {selectedOrder.shipping.toLocaleString()} MMK
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  {selectedOrder.total.toLocaleString()} MMK
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              {selectedOrder.status !== 'RECEIVED' &&
                selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => {
                      // Navigate to receive shipment page
                      if (onNavigateToReceiveShipment) {
                        onNavigateToReceiveShipment(selectedOrder.id);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Receive Shipment
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderList;
