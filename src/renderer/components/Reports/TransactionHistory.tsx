import React, { useState, useEffect } from 'react';
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

interface Transaction {
  id: string;
  receiptNumber: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  customerId?: string;
  customerName?: string;
  userId: string;
  userEmail: string;
  timestamp: Date;
  status: 'completed' | 'refunded' | 'partial_refund';
  refundAmount?: number;
  notes?: string;
  synced: boolean;
}

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        receiptNumber: 'RCP-001',
        items: [
          {
            id: '1',
            productId: 'prod1',
            productName: 'Premium Coffee Beans',
            sku: 'PROD001',
            quantity: 2,
            price: 12.99,
            total: 25.98,
          },
        ],
        subtotal: 25.98,
        tax: 2.08,
        total: 28.06,
        paymentMethod: 'card',
        customerId: 'cust1',
        customerName: 'John Doe',
        userId: 'user1',
        userEmail: 'cashier@store.com',
        timestamp: new Date('2024-01-15T14:30:00'),
        status: 'completed',
        synced: true,
      },
      {
        id: '2',
        receiptNumber: 'RCP-002',
        items: [
          {
            id: '2',
            productId: 'prod2',
            productName: 'Ceramic Espresso Cup',
            sku: 'PROD002',
            quantity: 1,
            price: 8.5,
            total: 8.5,
          },
        ],
        subtotal: 8.5,
        tax: 0.68,
        total: 9.18,
        paymentMethod: 'cash',
        userId: 'user1',
        userEmail: 'cashier@store.com',
        timestamp: new Date('2024-01-15T15:45:00'),
        status: 'completed',
        synced: false,
      },
    ];

    setTransactions(mockTransactions);
  }, []);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.receiptNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.customerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.items.some((item) =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    const transactionDate = new Date(transaction.timestamp);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end + 'T23:59:59');
    const matchesDate =
      transactionDate >= startDate && transactionDate <= endDate;

    const matchesPayment =
      paymentFilter === 'all' || transaction.paymentMethod === paymentFilter;
    const matchesStatus =
      statusFilter === 'all' || transaction.status === statusFilter;

    return matchesSearch && matchesDate && matchesPayment && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const calculateTotals = () => {
    const totalRevenue = filteredTransactions.reduce(
      (sum, t) => sum + t.total,
      0,
    );
    const totalTax = filteredTransactions.reduce((sum, t) => sum + t.tax, 0);
    const completedTransactions = filteredTransactions.filter(
      (t) => t.status === 'completed',
    ).length;

    return {
      totalRevenue,
      totalTax,
      transactionCount: filteredTransactions.length,
      completedTransactions,
    };
  };

  const handleRefund = async (transactionId: string, amount?: number) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    const refundAmount = amount || transaction.total;
    const confirmed = window.confirm(
      `Are you sure you want to refund $${refundAmount.toFixed(2)} for transaction ${transaction.receiptNumber}?`,
    );

    if (confirmed) {
      try {
        const updatedTransaction = {
          ...transaction,
          status: (refundAmount === transaction.total
            ? 'refunded'
            : 'partial_refund') as Transaction['status'],
          refundAmount: refundAmount,
        };

        setTransactions((prev) =>
          prev.map((t) => (t.id === transactionId ? updatedTransaction : t)),
        );
        alert(`Refund of $${refundAmount.toFixed(2)} processed successfully!`);
      } catch (error) {
        console.error('Refund failed:', error);
        alert('Refund failed. Please try again.');
      }
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      [
        'Receipt',
        'Date',
        'Customer',
        'Items',
        'Subtotal',
        'Tax',
        'Total',
        'Payment',
        'Status',
      ].join(','),
      ...filteredTransactions.map((t) =>
        [
          t.receiptNumber,
          t.timestamp.toISOString(),
          t.customerName || 'Walk-in',
          t.items.length,
          t.subtotal.toFixed(2),
          t.tax.toFixed(2),
          t.total.toFixed(2),
          t.paymentMethod,
          t.status,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${dateRange.start}_to_${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Transaction History
            </h1>
            <p className="text-gray-600">
              View and manage all sales transactions
            </p>
          </div>
          <button
            onClick={exportTransactions}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-2xl font-bold text-green-600">
              ${totals.totalRevenue.toFixed(2)}
            </h3>
            <p className="text-gray-600">Total Revenue</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-2xl font-bold text-blue-600">
              {totals.transactionCount}
            </h3>
            <p className="text-gray-600">Total Transactions</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-2xl font-bold text-purple-600">
              ${totals.totalTax.toFixed(2)}
            </h3>
            <p className="text-gray-600">Total Tax Collected</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-2xl font-bold text-orange-600">
              {totals.completedTransactions}
            </h3>
            <p className="text-gray-600">Completed Sales</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Receipt, customer, product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="digital">Digital</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="partial_refund">Partial Refund</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTransactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.receiptNumber}
                        </div>
                        {!transaction.synced && (
                          <div
                            className="ml-2 w-2 h-2 bg-yellow-500 rounded-full"
                            title="Not synced"
                          ></div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{transaction.timestamp.toLocaleDateString()}</div>
                      <div className="text-gray-500">
                        {transaction.timestamp.toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.customerName || 'Walk-in Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.items.length} item
                      {transaction.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">
                        ${transaction.total.toFixed(2)}
                      </div>
                      <div className="text-gray-500">
                        Tax: ${transaction.tax.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.paymentMethod === 'cash'
                            ? 'bg-green-100 text-green-800'
                            : transaction.paymentMethod === 'card'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {transaction.paymentMethod.charAt(0).toUpperCase() +
                          transaction.paymentMethod.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'refunded'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {transaction.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            setShowDetails(
                              showDetails === transaction.id
                                ? null
                                : transaction.id,
                            )
                          }
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          title="Print Receipt"
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </button>
                        {transaction.status === 'completed' && (
                          <button
                            onClick={() => handleRefund(transaction.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Process Refund"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Transaction Details Row */}
                  {showDetails === transaction.id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Transaction Details
                              </h4>
                              <dl className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <dt className="text-gray-600">Cashier:</dt>
                                  <dd>{transaction.userEmail}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-gray-600">Subtotal:</dt>
                                  <dd>${transaction.subtotal.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-gray-600">Tax:</dt>
                                  <dd>${transaction.tax.toFixed(2)}</dd>
                                </div>
                                <div className="flex justify-between font-medium">
                                  <dt className="text-gray-900">Total:</dt>
                                  <dd>${transaction.total.toFixed(2)}</dd>
                                </div>
                                {transaction.refundAmount && (
                                  <div className="flex justify-between text-red-600">
                                    <dt>Refunded:</dt>
                                    <dd>
                                      -${transaction.refundAmount.toFixed(2)}
                                    </dd>
                                  </div>
                                )}
                              </dl>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                Items Purchased
                              </h4>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {transaction.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between text-sm"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {item.productName}
                                      </div>
                                      <div className="text-gray-600">
                                        SKU: {item.sku}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div>
                                        {item.quantity} × $
                                        {item.price.toFixed(2)}
                                      </div>
                                      <div className="font-medium">
                                        ${item.total.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {transaction.notes && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">
                                Notes
                              </h4>
                              <p className="text-sm text-gray-600">
                                {transaction.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{' '}
                {Math.min(
                  startIndex + itemsPerPage,
                  filteredTransactions.length,
                )}{' '}
                of {filteredTransactions.length} transactions
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
