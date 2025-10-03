import React, { useState, useEffect } from 'react';
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CreditCardIcon,
  CalendarIcon,
  ChartBarIcon,
  TruckIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// interface Transaction {
//   id: string;
//   date: Date;
//   type: 'SALE' | 'PAYMENT' | 'CREDIT' | 'EGG_COLLECTION';
//   amount: number;
//   items?: string;
//   paymentMethod?: string;
//   status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
//   notes?: string;
// }
import { Transaction, PaymentRecord } from '../../types/core';

interface Customer {
  id: string;
  type: string;
  businessName?: string;
  contactPerson: string;
  email?: string;
  phone?: string;
  address?: string;
  creditLimit: number;
  creditBalance: number;
  paymentTerms: number;
  creditStatus: string;
  farmSize?: number;
  animalTypes?: string[];
  henEggsDailyProduction: number;
  duckEggsDailyProduction: number;
  collectionSchedule: string;
  isRetail: boolean;
  loyaltyPoints: number;
  totalPurchases: number;
  totalEggSales: number;
  lastPurchase?: Date;
  lastEggCollection?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customerId,
  onBack,
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'transactions' | 'eggs' | 'payment'
  >('overview');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterRecordType, setFilterRecordType] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<
    '7days' | '30days' | '90days' | 'all'
  >('30days');
  const [dateRangeRecord, setDateRangeRecord] = useState<
    '7days' | '30days' | '90days' | 'all'
  >('30days');

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPayFarmerModal, setShowPayFarmerModal] = useState(false);
  const [showDebitFarmerModal, setShowDebitFarmerModal] = useState(false);

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [debitAmount, setDebitAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'DIGITAL'
  >('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [staffId, setStaffId] = useState('');

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // Fetch customer details
        const customerData = await window.api.getCustomerDetail(customerId);
        setCustomer(customerData);
        const staff: any = await window.api.check();
        setStaffId(staff.id);
        // Fetch transactions
        const transactionData =
          await window.api.getCustomerTransactions(customerId);
        setTransactions(transactionData);
        const paymentRecordData =
          await window.api.getPaymentRecordsWithCustomerId(customerId);
        setPaymentRecord(paymentRecordData);
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  const refreshCustomerData = async () => {
    const customerData = await window.api.getCustomerDetail(customerId);
    setCustomer(customerData);
    console.log('Customer Data', customerData);
    const transactionData =
      await window.api.getCustomerTransactions(customerId);
    setTransactions(transactionData);

    const paymentRecordData =
      await window.api.getPaymentRecordsWithCustomerId(customerId);
    setPaymentRecord(paymentRecordData);
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    if (paymentAmount > customer!.creditBalance) {
      alert('Payment amount cannot exceed credit balance');
      return;
    }

    try {
      const paymentRecord = {
        type: 'CUSTOMER_PAYMENT',
        amount: paymentAmount,
        customer: {
          connect: { id: customerId },
        },
        paymentMethod: paymentMethod,
        paymentDate: new Date(),
        staff: {
          connect: { id: staffId },
        },
        referenceNumber: paymentReference || undefined,
        notes: paymentNotes || undefined,
      };

      await window.api.createPaymentRecordData(paymentRecord);

      // Update customer credit balance
      const updatedCustomer = {
        ...customer!,
        creditBalance: customer!.creditBalance - paymentAmount,
      };
      await window.api.updateCustomer(updatedCustomer);
      await refreshCustomerData();
      setPaymentAmount(0);
      setPaymentReference('');
      setPaymentNotes('');
      setShowPaymentModal(false);

      alert('Payment received successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handlePayFarmer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than 0');
      return;
    }

    try {
      const paymentRecord = {
        type: 'EGG_PAYMENT',
        amount: paymentAmount,
        customer: {
          connect: { id: customerId },
        },
        paymentMethod: paymentMethod,
        paymentDate: new Date(),
        staff: {
          connect: { id: staffId },
        },
        referenceNumber: paymentReference || undefined,
        notes: paymentNotes || undefined,
      };

      await window.api.createPaymentRecordData(paymentRecord);

      // Refresh data
      const customerData = await window.api.getCustomerDetail(customerId);
      setCustomer(customerData);

      // Update customer credit balance
      const updatedCustomer = {
        ...customer!,
        creditBalance: customer!.creditBalance + paymentAmount,
      };

      await window.api.updateCustomer(updatedCustomer);
      await refreshCustomerData();

      // Reset form and close modal
      setPaymentAmount(0);
      setPaymentReference('');
      setPaymentNotes('');
      setShowPayFarmerModal(false);

      alert('Farmer payment processed successfully!');
    } catch (error) {
      console.error('Error processing farmer payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handleDebitFarmer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (debitAmount <= 0) {
      alert('Debit amount must be greater than 0');
      return;
    }

    try {
      const paymentRecord = {
        type: 'DEBIT',
        amount: debitAmount,
        customer: {
          connect: { id: customerId },
        },
        paymentMethod: paymentMethod,
        paymentDate: new Date(),
        staff: {
          connect: { id: staffId },
        },
        referenceNumber: paymentReference || undefined,
        notes: paymentNotes || undefined,
      };

      await window.api.createPaymentRecordData(paymentRecord);

      // Refresh data
      const customerData = await window.api.getCustomerDetail(customerId);
      setCustomer(customerData);

      // Update customer credit balance
      const updatedCustomer = {
        ...customer!,
        creditBalance: customer!.creditBalance + debitAmount,
      };

      await window.api.updateCustomer(updatedCustomer);
      await refreshCustomerData();

      // Reset form and close modal
      setDebitAmount(0);
      setPaymentReference('');
      setPaymentNotes('');
      setShowDebitFarmerModal(false);

      alert('Farmer payment processed successfully!');
      // window.location.reload();
    } catch (error) {
      console.error('Error processing farmer payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 animate-pulse">
          Loading customer details...
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">Customer not found</div>
      </div>
    );
  }

  const filteredTransactions = transactions
    .filter((t) => {
      if (filterType === 'ALL') return true;
      return t.type === filterType;
    })
    .filter((t) => {
      if (dateRange === 'all') return true;
      const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return new Date(t.timestamp) >= cutoff;
    });

  const filteredPaymentRecord = paymentRecord
    .filter((t) => {
      if (filterRecordType === 'ALL') return true;
      return t.type === filterRecordType;
    })
    .filter((t) => {
      if (dateRangeRecord === 'all') return true;
      const days =
        dateRangeRecord === '7days'
          ? 7
          : dateRangeRecord === '30days'
            ? 30
            : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return new Date(t.paymentDate) >= cutoff;
    });

  const stats = {
    totalTransactions: transactions.length,
    totalSpent: transactions
      .filter((t) => t.type === 'SALE')
      .reduce((sum, t) => sum + t.total, 0),
    totalPayments: transactions
      .filter((t) => t.type === 'PURCHASE')
      .reduce((sum, t) => sum + t.total, 0),
    avgTransaction:
      transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.total, 0) /
          transactions.length
        : 0,
  };

  const getCreditStatusColor = (status: string) => {
    switch (status) {
      case 'CURRENT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OVERDUE_30':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OVERDUE_60':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'OVERDUE_90':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'BAD_DEBT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'SALE':
        return 'bg-blue-100 text-blue-800';
      case 'PAYMENT':
        return 'bg-green-100 text-green-800';
      case 'CREDIT':
        return 'bg-orange-100 text-orange-800';
      case 'EGG_COLLECTION':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Customers
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl font-bold text-blue-600">
                  {customer.contactPerson}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {customer.contactPerson}
                </h1>
                {customer.businessName && (
                  <p className="text-lg text-gray-600">
                    {customer.businessName}
                  </p>
                )}
                <div className="flex items-center mt-2 space-x-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      customer.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {customer.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {customer.type}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getCreditStatusColor(customer.creditStatus)}`}
                  >
                    {customer.creditStatus?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {customer.type === 'FARMER' && (
                <button
                  onClick={() => setShowDebitFarmerModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
                >
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  Debit Farmer
                </button>
              )}
              {customer.type === 'FARMER' && (
                <button
                  onClick={() => setShowPayFarmerModal(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
                >
                  <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                  Pay Farmer
                </button>
              )}

              {customer.creditBalance > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  <CreditCardIcon className="w-5 h-5 mr-2" />
                  Receive Payment
                </button>
              )}

              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">Customer Since</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200">
            {customer.phone && (
              <div className="flex items-center">
                <PhoneIcon className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-600">Phone</div>
                  <div className="text-sm font-medium">{customer.phone}</div>
                </div>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center">
                <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-600">Email</div>
                  <div className="text-sm font-medium">{customer.email}</div>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <div className="text-xs text-gray-600">Address</div>
                  <div className="text-sm font-medium">{customer.address}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSpent.toLocaleString()} MMK
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Credit Balance</p>
              <p className="text-2xl font-bold text-orange-600">
                {customer.creditBalance} MMK
              </p>
              <p className="text-xs text-gray-500">
                Limit: {customer.creditLimit}
              </p>
            </div>
            <CreditCardIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalTransactions}
              </p>
              <p className="text-xs text-gray-500">
                Avg: {stats.avgTransaction.toFixed(0)} MMK
              </p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Loyalty Points</p>
              <p className="text-2xl font-bold text-yellow-600">
                {customer.loyaltyPoints}
              </p>
            </div>
            <CurrencyDollarIcon className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transactions
            </button>
            {customer.type === 'FARMER' && (
              <button
                onClick={() => setActiveTab('eggs')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'eggs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Egg Production
              </button>
            )}
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment Record
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Credit Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Credit Information
                  </h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Limit:</span>
                      <span className="font-medium">
                        {customer.creditLimit} MMK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="font-medium text-orange-600">
                        {customer.creditBalance} MMK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Credit:</span>
                      <span className="font-medium text-green-600">
                        {customer.creditLimit - customer.creditBalance} MMK
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Terms:</span>
                      <span className="font-medium">
                        {customer.paymentTerms} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Farmer Information */}
                {customer.type === 'FARMER' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Farm Details</h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      {customer.farmSize && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Farm Size:</span>
                          <span className="font-medium">
                            {customer.farmSize} acres
                          </span>
                        </div>
                      )}
                      {customer.animalTypes &&
                        customer.animalTypes.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Animals:</span>
                            <span className="font-medium">
                              {customer.animalTypes.join(', ')}
                            </span>
                          </div>
                        )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hen Eggs/Day:</span>
                        <span className="font-medium">
                          {customer.henEggsDailyProduction}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duck Eggs/Day:</span>
                        <span className="font-medium">
                          {customer.duckEggsDailyProduction}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Collection Schedule:
                        </span>
                        <span className="font-medium">
                          {customer.collectionSchedule}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {customer.lastPurchase && (
                    <div className="flex items-center text-sm">
                      <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Last Purchase:</span>
                      <span className="ml-2 font-medium">
                        {new Date(customer.lastPurchase).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {customer.lastEggCollection && (
                    <div className="flex items-center text-sm">
                      <TruckIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">
                        Last Egg Collection:
                      </span>
                      <span className="ml-2 font-medium">
                        {new Date(
                          customer.lastEggCollection,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              {/* Filters */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Types</option>
                    <option value="SALE">Sales</option>
                    <option value="PURCHASE">Purchase</option>
                    <option value="EGG_SALE">Egg Sale</option>
                    <option value="EGG_COLLECTION">Egg Collections</option>
                    <option value="REFUND">Refund</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>

                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {filteredTransactions.length} of {transactions.length}{' '}
                  transactions
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(
                              transaction.timestamp,
                            ).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}
                          >
                            {transaction.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {/* {transaction.items || transaction.notes || '-'} */}
                          {transaction.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.paymentMethod || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span
                            className={
                              transaction.type === 'SALE'
                                ? 'text-green-600'
                                : 'text-gray-900'
                            }
                          >
                            {transaction.type === 'PURCHASE' ? '+' : ''}
                            {transaction.total.toLocaleString()} MMK
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No transactions found
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'eggs' && customer.type === 'FARMER' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    Daily Hen Production
                  </p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {customer.henEggsDailyProduction}
                  </p>
                  <p className="text-xs text-gray-500">eggs per day</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    Daily Duck Production
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {customer.duckEggsDailyProduction}
                  </p>
                  <p className="text-xs text-gray-500">eggs per day</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Egg Sales</p>
                  <p className="text-3xl font-bold text-green-600">
                    {customer.totalEggSales.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">MMK</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Collection Schedule</h4>
                <p className="text-gray-600">{customer.collectionSchedule}</p>
                {customer.lastEggCollection && (
                  <p className="text-sm text-gray-500 mt-2">
                    Last collection:{' '}
                    {new Date(customer.lastEggCollection).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
          {activeTab === 'payment' && (
            <div>
              {/* Filters */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                  <select
                    value={filterRecordType}
                    onChange={(e) => setFilterRecordType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Types</option>
                    <option value="DEBIT">Debit</option>
                    <option value="CUSTOMER_PAYMENT">Customer Payment</option>
                    <option value="EGG_PAYMENT">Egg Payment</option>
                  </select>

                  <select
                    value={dateRangeRecord}
                    onChange={(e) => setDateRangeRecord(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {filteredPaymentRecord.length} of{' '}
                  {paymentRecord.length} Record
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPaymentRecord.map((paymentRecord) => (
                      <tr key={paymentRecord.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(
                            paymentRecord.paymentDate,
                          ).toLocaleDateString()}
                          <div className="text-xs text-gray-500">
                            {new Date(
                              paymentRecord.paymentDate,
                            ).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(paymentRecord.type)}`}
                          >
                            {paymentRecord.type.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {paymentRecord.paymentMethod || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {/* {transaction.items || transaction.notes || '-'} */}
                          {paymentRecord.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full`}
                          >
                            {paymentRecord.staff.username}
                          </span>
                        </td>
                        <td className="text-sm text-gray-900">
                          {paymentRecord.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPaymentRecord.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No Payment Record found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {showPaymentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Receive Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    Current Credit Balance:
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {customer?.creditBalance.toLocaleString()} MMK
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  value={paymentAmount || ''}
                  onChange={(e) =>
                    setPaymentAmount(parseFloat(e.target.value) || 0)
                  }
                  max={customer?.creditBalance}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                />
                <div className="mt-1 flex space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentAmount(customer!.creditBalance * 0.25)
                    }
                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentAmount(customer!.creditBalance * 0.5)
                    }
                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentAmount(customer!.creditBalance * 0.75)
                    }
                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(customer!.creditBalance)}
                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                  >
                    Full
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHECK">Check</option>
                  <option value="DIGITAL">Digital Payment</option>
                </select>
              </div>

              {(paymentMethod === 'BANK_TRANSFER' ||
                paymentMethod === 'CHECK' ||
                paymentMethod === 'DIGITAL') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Transaction/Check number"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              {paymentAmount > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Remaining Balance:
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {(
                        customer!.creditBalance - paymentAmount
                      ).toLocaleString()}{' '}
                      MMK
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Farmer Modal */}
      {showPayFarmerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Pay Farmer for Eggs
              </h3>
              <button
                onClick={() => setShowPayFarmerModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePayFarmer} className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Farmer:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {customer?.contactPerson}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total Egg Sales:
                  </span>
                  <span className="text-lg font-semibold text-yellow-600">
                    {customer?.totalEggSales?.toLocaleString()} MMK
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  value={paymentAmount || ''}
                  onChange={(e) =>
                    setPaymentAmount(parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHECK">Check</option>
                  <option value="DIGITAL">Digital Payment</option>
                </select>
              </div>

              {(paymentMethod === 'BANK_TRANSFER' ||
                paymentMethod === 'CHECK' ||
                paymentMethod === 'DIGITAL') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Transaction/Check number"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Collection dates, quality notes, etc..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => false}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDebitFarmerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Debit For Farmer
              </h3>
              <button
                onClick={() => setShowDebitFarmerModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleDebitFarmer} className="space-y-4">
              {/* <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Farmer:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {customer?.contactPerson}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total Egg Sales:
                  </span>
                  <span className="text-lg font-semibold text-yellow-600">
                    {customer?.totalEggSales.toLocaleString()} MMK
                  </span>
                </div>
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Debit Amount *
                </label>
                <input
                  type="number"
                  value={debitAmount || ''}
                  onChange={(e) =>
                    setDebitAmount(parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHECK">Check</option>
                  <option value="DIGITAL">Digital Payment</option>
                </select>
              </div>

              {(paymentMethod === 'BANK_TRANSFER' ||
                paymentMethod === 'CHECK' ||
                paymentMethod === 'DIGITAL') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Transaction/Check number"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Collection dates, quality notes, etc..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDebitFarmerModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
