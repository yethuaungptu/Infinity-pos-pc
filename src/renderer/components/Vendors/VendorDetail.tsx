import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CreditCardIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  creditLimit: number;
  creditBalance: number;
  paymentTerms: number;
  earlyPaymentDiscount?: number;
  productTypes: string[];
  totalPurchases: number;
  onTimePaymentRate: number;
  lastOrder?: Date;
  lastPayment?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentRecord {
  id: string;
  type: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  dueDate?: Date;
  referenceNumber?: string;
  checkNumber?: string;
  notes?: string;
  processedBy: string;
}

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

interface VendorDetailProps {
  vendorId: string;
  onBack: () => void;
}

const VendorDetail: React.FC<VendorDetailProps> = ({ vendorId, onBack }) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [orders, setPurchaseOrder] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'payments' | 'orders'
  >('overview');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<
    '30days' | '90days' | 'year' | 'all'
  >('90days');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const vendorData = await window.api.getVendorDetail(vendorId);
        setVendor(vendorData);

        const paymentsData =
          await window.api.getPaymentRecordsWithVendorId(vendorId);
        setPaymentRecords(paymentsData);
        const purchaseData = await window.api.getPurchaseByVendor(vendorId);
        setPurchaseOrder(purchaseData);
        console.log(purchaseData);
      } catch (error) {
        console.error('Error fetching vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 animate-pulse">
          Loading vendor details...
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">Vendor not found</div>
      </div>
    );
  }

  const filteredPayments = paymentRecords.filter((p) => {
    if (filterType !== 'ALL' && p.type !== filterType) return false;

    if (dateRange === 'all') return true;
    const days =
      dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(p.paymentDate) >= cutoff;
  });

  const stats = {
    totalPayments: paymentRecords.filter((p) => p.type === 'VENDOR_PAYMENT')
      .length,
    totalPaid: paymentRecords
      .filter((p) => p.type === 'VENDOR_PAYMENT')
      .reduce((sum, p) => sum + p.amount, 0),
    avgPayment:
      paymentRecords.length > 0
        ? paymentRecords.reduce((sum, p) => sum + p.amount, 0) /
          paymentRecords.length
        : 0,
    totalPurchases: orders.reduce((sum, o) => sum + o.total, 0),
  };

  const fullAddress = [
    vendor.street,
    vendor.city,
    vendor.state,
    vendor.zipCode,
    vendor.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Vendors
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl font-bold text-purple-600">
                  {vendor.companyName.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {vendor.companyName}
                </h1>
                <p className="text-lg text-gray-600">{vendor.contactPerson}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      vendor.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {vendor.active ? 'Active' : 'Inactive'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      vendor.creditBalance > 0
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {vendor.creditBalance > 0
                      ? `${vendor.creditBalance.toLocaleString()} MMK Owed`
                      : 'Paid Up'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Vendor Since</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date(vendor.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200">
            {vendor.phone && (
              <div className="flex items-center">
                <PhoneIcon className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-600">Phone</div>
                  <div className="text-sm font-medium">{vendor.phone}</div>
                </div>
              </div>
            )}
            {vendor.email && (
              <div className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-600">Email</div>
                  <div className="text-sm font-medium">{vendor.email}</div>
                </div>
              </div>
            )}
            {/* {fullAddress && (
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-600">Address</div>
                  <div className="text-sm font-medium">{fullAddress}</div>
                </div>
              </div>
            )} */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalPurchases.toLocaleString()} MMK
              </p>
            </div>
            <TruckIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Amount Owed</p>
              <p className="text-2xl font-bold text-orange-600">
                {vendor.creditBalance.toLocaleString()} MMK
              </p>
              <p className="text-xs text-gray-500">
                Limit: {vendor.creditLimit.toLocaleString()}
              </p>
            </div>
            <CreditCardIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalPaid.toLocaleString()} MMK
              </p>
              <p className="text-xs text-gray-500">
                {stats.totalPayments} payments
              </p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Credit</p>
              <p className="text-2xl font-bold text-purple-600">
                {(
                  vendor.creditBalance -
                  (stats.totalPurchases - stats.totalPaid)
                ).toLocaleString()}{' '}
                MMK
              </p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Records
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Purchase Orders
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Credit Terms</h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Limit:</span>
                      <span className="font-medium">
                        {vendor.creditLimit.toLocaleString()} MMK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="font-medium text-orange-600">
                        {vendor.creditBalance.toLocaleString()} MMK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Credit:</span>
                      <span className="font-medium text-green-600">
                        {(
                          vendor.creditLimit - vendor.creditBalance
                        ).toLocaleString()}{' '}
                        MMK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Terms:</span>
                      <span className="font-medium">
                        {vendor.paymentTerms} days
                      </span>
                    </div>
                    {vendor.earlyPaymentDiscount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Early Payment Discount:
                        </span>
                        <span className="font-medium text-green-600">
                          {vendor.earlyPaymentDiscount}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Product Categories
                  </h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {vendor.productTypes && vendor.productTypes.length > 0 ? (
                      vendor.productTypes.map((type, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2 mb-2"
                        >
                          {type}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No product categories specified
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {vendor.lastOrder && (
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Last Order:</span>
                      <span className="ml-2 font-medium">
                        {new Date(vendor.lastOrder).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {vendor.lastPayment && (
                    <div className="flex items-center text-sm">
                      <CurrencyDollarIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Last Payment:</span>
                      <span className="ml-2 font-medium">
                        {new Date(vendor.lastPayment).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Types</option>
                    <option value="VENDOR_PAYMENT">Payments</option>
                  </select>

                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="year">This Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {filteredPayments.length} of {paymentRecords.length}{' '}
                  records
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(payment.paymentDate).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {payment.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {payment.amount.toLocaleString()} MMK
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.referenceNumber ||
                            payment.checkNumber ||
                            '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {payment.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPayments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No payment records found
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="flex gap-4 mb-3">
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
                              (sum: any, item: any) =>
                                sum + item.quantityReceived,
                              0,
                            )}{' '}
                            /{' '}
                            {order.items.reduce(
                              (sum: any, item: any) =>
                                sum + item.quantityOrdered,
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
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPayments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No payment records found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDetail;
