import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CreditCardIcon,
  ChartBarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Customer } from '../../types/core';

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  averageSpent: number;
  topSpender: Customer | null;
}

const CustomerManagement: React.FC<{ onViewCustomer: (id: any) => void }> = ({
  onViewCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof Customer>('contactPerson');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({
    type: 'FARMER',
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    creditLimit: 0,
    creditBalance: 0, // Current outstanding amount
    paymentTerms: 7, // Days (7, 30, 60, 90)
    creditStatus: 'CURRENT',
    farmSize: 0, // in acres
    animalTypes: [], // ['poultry', 'cattle', 'dairy']
    henEggsDailyProduction: 0,
    duckEggsDailyProduction: 0,
    collectionSchedule: 'DAILY',
    loyaltyPoints: 0,
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customers = await window.api.getCustomers();
        setCustomers(customers); // Replace with allProducts when backend is ready
      } catch (error) {
        console.error('Error fetching products:', error);
        setCustomers([]); // Fallback to mock data on error
      }
    };
    fetchCustomers();
  }, []);

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({ ...customer });
    } else {
      setEditingCustomer(null);
      setFormData({
        type: 'FARMER',
        businessName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        creditLimit: 0,
        creditBalance: 0, // Current outstanding amount
        paymentTerms: 7, // Days (7, 30, 60, 90)
        creditStatus: 'CURRENT',
        farmSize: 0, // in acres
        animalTypes: [], // ['poultry', 'cattle', 'dairy']
        henEggsDailyProduction: 0,
        duckEggsDailyProduction: 0,
        collectionSchedule: 'DAILY',
        loyaltyPoints: 0,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCustomer) {
        // Update existing customer
        const updatedCustomer = {
          ...editingCustomer,
          ...formData,
          updatedAt: new Date(),
        } as Customer;
        console.log('Updating customer with data:', updatedCustomer);
        await window.api.updateCustomer(updatedCustomer);
        setCustomers((prev) =>
          prev.map((c) => (c.id === editingCustomer.id ? updatedCustomer : c)),
        );
        console.log('Updated customer:', updatedCustomer);
      } else {
        // Create new customer
        const newCustomer: Customer = {
          ...(formData as Customer),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await window.api.createCustomerData(newCustomer);
        setCustomers((prev) => [...prev, newCustomer]);
        console.log('Created customer:', newCustomer);
      }

      closeModal();
      alert(
        editingCustomer
          ? 'Customer updated successfully!'
          : 'Customer created successfully!',
      );
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer. Please try again.');
    }
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        setCustomers((prev) => prev.filter((c) => c.id !== customerId));
        console.log('Deleted customer:', customerId);
        alert('Customer deleted successfully!');
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer. Please try again.');
      }
    }
  };

  const filteredCustomers = customers
    .filter((customer) => {
      const fullName = `${customer.contactPerson} `.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(searchTerm)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const calculateStats = (): CustomerStats => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newCustomersThisMonth = customers.filter(
      (c) => c.createdAt >= thisMonth,
    ).length;
    const activeCustomers = customers.filter((c) => c.active).length;
    const totalSpent = customers.reduce(
      (sum, c) => sum + c.totalPurchases || 0,
      0,
    );
    const averageSpent =
      customers.length > 0 ? totalSpent / customers.length : 0;
    const topSpender = customers.reduce(
      (top, customer) =>
        top.totalPurchases > customer.totalPurchases ? top : customer,
      customers[0] || null,
    );

    return {
      totalCustomers: customers.length,
      activeCustomers,
      newCustomersThisMonth,
      averageSpent,
      topSpender,
    };
  };

  const stats = calculateStats();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Customer Management
            </h1>
            <p className="text-gray-600">
              Manage customer information and loyalty programs
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Customer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {stats.totalCustomers}
                </h3>
                <p className="text-gray-600">Total Customers</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-600">
                  {stats.activeCustomers}
                </h3>
                <p className="text-gray-600">Active Customers</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <PlusIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-purple-600">
                  {stats.newCustomersThisMonth}
                </h3>
                <p className="text-gray-600">New This Month</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-orange-600">
                  {stats.averageSpent} MMK
                </h3>
                <p className="text-gray-600">Average Spent</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-xl font-bold text-yellow-600">
                  {stats.topSpender?.contactPerson || 'N/A'}
                </h3>
                <p className="text-gray-600">Top Spender</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as keyof Customer);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="lastName-asc">Last Name (A-Z)</option>
            <option value="lastName-desc">Last Name (Z-A)</option>
            <option value="firstName-asc">First Name (A-Z)</option>
            <option value="firstName-desc">First Name (Z-A)</option>
            <option value="totalSpent-desc">Total Spent (High-Low)</option>
            <option value="totalSpent-asc">Total Spent (Low-High)</option>
            <option value="loyaltyPoints-desc">
              Loyalty Points (High-Low)
            </option>
            <option value="lastVisit-desc">Last Visit (Recent)</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loyalty Points
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
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
              {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.contactPerson}
                        </div>
                        {customer.businessName && (
                          <div className="text-sm text-gray-500">
                            {customer.businessName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {customer.email && (
                        <div className="flex items-center mb-1">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">
                      {customer.totalPurchases || 0} MMK
                    </div>
                    <div className="text-gray-500">
                      Avg:
                      {(customer.totalPurchases || 0) / 1} MMK
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.creditBalance} MMK
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {customer.loyaltyPoints} pts
                    </span>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.lastPurchase
                      ? customer.lastPurchase.toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {customer.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(customer)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onViewCustomer(customer.id)}
                      className="text-blue-600"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    {/* <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button> */}
                  </td>
                </tr>
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
                {Math.min(startIndex + itemsPerPage, filteredCustomers.length)}{' '}
                of {filteredCustomers.length} customers
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  return page <= totalPages ? (
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
                  ) : null;
                })}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-[700px] shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer Type *
                </label>
                <select
                  value={formData.type || 'FARMER'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value ? e.target.value : 'FARMER',
                    }))
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select type</option>
                  <option value="FARMER">Farmer</option>
                  <option value="REGULAR">Regular</option>
                  <option value="WHOLESALE">Wholesale</option>
                </select>
              </div>

              {/* Business Name + Contact Person */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        businessName: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactPerson: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Full Address"
                  value={formData.address || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Credit Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    value={formData.creditLimit || 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        creditLimit: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Terms (days)
                  </label>
                  <input
                    type="number"
                    value={formData.paymentTerms || 30}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentTerms: parseInt(e.target.value) || 30,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Credit Status
                  </label>
                  <select
                    value={formData.creditStatus || 'CURRENT'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        creditStatus: e.target.value
                          ? e.target.value
                          : 'CURRENT',
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="CURRENT">Current</option>
                    <option value="OVERDUE_30">Overdue 30</option>
                    <option value="OVERDUE_60">Overdue 60</option>
                    <option value="OVERDUE_90">Overdue 90</option>
                    <option value="BAD_DEBT">Bad Debt</option>
                  </select>
                </div>
              </div>

              {/* Farmer Fields */}
              {formData.type === 'FARMER' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Farm Size (acres)
                  </label>
                  <input
                    type="number"
                    value={formData.farmSize || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        farmSize: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    Animal Types (comma separated)
                  </label>
                  <input
                    type="text"
                    defaultValue={
                      Array.isArray(formData.animalTypes)
                        ? formData.animalTypes.join(', ')
                        : ''
                    }
                    onBlur={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        animalTypes: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              )}

              {/* Egg Production */}
              {formData.type === 'FARMER' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hen Eggs (daily)
                    </label>
                    <input
                      type="number"
                      value={formData.henEggsDailyProduction || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          henEggsDailyProduction: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duck Eggs (daily)
                    </label>
                    <input
                      type="number"
                      value={formData.duckEggsDailyProduction || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          duckEggsDailyProduction:
                            parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Collection Schedule
                    </label>
                    <select
                      value={formData.collectionSchedule || 'DAILY'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          collectionSchedule: e.target.value
                            ? e.target.value
                            : 'DAILY',
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="ALTERNATE">Alternate</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Retail toggle */}
              {formData.type === 'RETAIL' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRetail"
                    checked={formData.isRetail || false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isRetail: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isRetail"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Retail Customer
                  </label>
                </div>
              )}

              {/* Loyalty Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Loyalty Points
                </label>
                <input
                  type="number"
                  value={formData.loyaltyPoints || 0}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      loyaltyPoints: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              {/* Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="active"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Customer is active
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
