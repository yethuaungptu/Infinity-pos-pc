import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Vendor, ProductType } from '../../types/core';

const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all');
  const [creditStatusFilter, setCreditStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedVendorForPayment, setSelectedVendorForPayment] =
    useState<Vendor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState<Partial<Vendor>>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    creditLimit: 0,
    paymentTerms: 30,
    earlyPaymentDiscount: 0,
    productTypes: [],
    active: true,
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockVendors: Vendor[] = [
      {
        id: '1',
        companyName: 'AgriSupply Co.',
        contactPerson: 'John Smith',
        email: 'john@agrisupply.com',
        phone: '+1-555-0201',
        address: {
          street: '123 Farm Road',
          city: 'Farmville',
          state: 'CA',
          zipCode: '93444',
          country: 'US',
        },
        creditLimit: 200000,
        creditBalance: 85000,
        paymentTerms: 45,
        earlyPaymentDiscount: 2,
        productTypes: ['feed', 'supplies'],
        totalPurchases: 450000,
        onTimePaymentRate: 98,
        lastOrder: new Date('2024-01-10'),
        lastPayment: new Date('2024-01-05'),
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date(),
        active: true,
      },
      {
        id: '2',
        companyName: 'VetMed Solutions',
        contactPerson: 'Dr. Sarah Johnson',
        email: 'sarah@vetmed.com',
        phone: '+1-555-0202',
        address: {
          street: '456 Medical Blvd',
          city: 'Healthtown',
          state: 'TX',
          zipCode: '75001',
          country: 'US',
        },
        creditLimit: 150000,
        creditBalance: 45000,
        paymentTerms: 60,
        earlyPaymentDiscount: 1.5,
        productTypes: ['medicine'],
        totalPurchases: 280000,
        onTimePaymentRate: 100,
        lastOrder: new Date('2024-01-12'),
        lastPayment: new Date('2024-01-08'),
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date(),
        active: true,
      },
      {
        id: '3',
        companyName: 'Farm Equipment Plus',
        contactPerson: 'Mike Wilson',
        email: 'mike@farmequip.com',
        phone: '+1-555-0203',
        creditLimit: 100000,
        creditBalance: 25000,
        paymentTerms: 30,
        earlyPaymentDiscount: 2.5,
        productTypes: ['equipment'],
        totalPurchases: 125000,
        onTimePaymentRate: 95,
        lastOrder: new Date('2024-01-08'),
        lastPayment: new Date('2024-01-12'),
        createdAt: new Date('2023-06-10'),
        updatedAt: new Date(),
        active: true,
      },
    ];

    setVendors(mockVendors);
  }, []);

  const openModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({ ...vendor });
    } else {
      setEditingVendor(null);
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        creditLimit: 0,
        paymentTerms: 30,
        earlyPaymentDiscount: 0,
        productTypes: [],
        active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    setFormData({});
  };

  const openPaymentModal = (vendor: Vendor) => {
    setSelectedVendorForPayment(vendor);
    setPaymentAmount(vendor.creditBalance);
    setShowPaymentModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingVendor) {
        // Update existing vendor
        const updatedVendor = {
          ...editingVendor,
          ...formData,
          updatedAt: new Date(),
        } as Vendor;

        setVendors((prev) =>
          prev.map((v) => (v.id === editingVendor.id ? updatedVendor : v)),
        );
        console.log('Updated vendor:', updatedVendor);
      } else {
        // Create new vendor
        const newVendor: Vendor = {
          id: Date.now().toString(),
          ...(formData as Vendor),
          creditBalance: 0,
          totalPurchases: 0,
          onTimePaymentRate: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setVendors((prev) => [...prev, newVendor]);
        console.log('Created vendor:', newVendor);
      }

      closeModal();
      alert(
        editingVendor
          ? 'Vendor updated successfully!'
          : 'Vendor created successfully!',
      );
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor. Please try again.');
    }
  };

  const handleDelete = async (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor && vendor.creditBalance > 0) {
      alert(
        'Cannot delete vendor with outstanding balance. Please clear the balance first.',
      );
      return;
    }

    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        setVendors((prev) => prev.filter((v) => v.id !== vendorId));
        console.log('Deleted vendor:', vendorId);
        alert('Vendor deleted successfully!');
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Failed to delete vendor. Please try again.');
      }
    }
  };

  const handlePayment = async () => {
    if (!selectedVendorForPayment || paymentAmount <= 0) return;

    try {
      const updatedVendor = {
        ...selectedVendorForPayment,
        creditBalance: selectedVendorForPayment.creditBalance - paymentAmount,
        lastPayment: new Date(),
        updatedAt: new Date(),
      };

      setVendors((prev) =>
        prev.map((v) =>
          v.id === selectedVendorForPayment.id ? updatedVendor : v,
        ),
      );
      setShowPaymentModal(false);
      setSelectedVendorForPayment(null);
      setPaymentAmount(0);

      console.log('Processed payment:', paymentAmount);
      alert(
        `Payment of $${paymentAmount.toLocaleString()} processed successfully!`,
      );
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const toggleProductType = (productType: ProductType) => {
    const currentTypes = formData.productTypes || [];
    const hasType = currentTypes.includes(productType);

    const newTypes = hasType
      ? currentTypes.filter((t) => t !== productType)
      : [...currentTypes, productType];

    setFormData((prev) => ({ ...prev, productTypes: newTypes }));
  };

  const getCreditStatusColor = (vendor: Vendor) => {
    const utilizationRate = (vendor.creditBalance / vendor.creditLimit) * 100;
    if (utilizationRate >= 90) return 'text-red-600';
    if (utilizationRate >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProductType =
      productTypeFilter === 'all' ||
      vendor.productTypes.includes(productTypeFilter as ProductType);

    let matchesCreditStatus = true;
    if (creditStatusFilter !== 'all') {
      const utilizationRate = (vendor.creditBalance / vendor.creditLimit) * 100;
      if (creditStatusFilter === 'high' && utilizationRate < 70)
        matchesCreditStatus = false;
      if (
        creditStatusFilter === 'medium' &&
        (utilizationRate < 30 || utilizationRate >= 70)
      )
        matchesCreditStatus = false;
      if (creditStatusFilter === 'low' && utilizationRate >= 30)
        matchesCreditStatus = false;
    }

    return matchesSearch && matchesProductType && matchesCreditStatus;
  });

  const totalCreditLimit = vendors.reduce((sum, v) => sum + v.creditLimit, 0);
  const totalOutstanding = vendors.reduce((sum, v) => sum + v.creditBalance, 0);
  const totalPurchases = vendors.reduce((sum, v) => sum + v.totalPurchases, 0);
  const averagePaymentRate =
    vendors.reduce((sum, v) => sum + v.onTimePaymentRate, 0) / vendors.length ||
    0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Vendor Management
            </h1>
            <p className="text-gray-600">Manage suppliers and payment terms</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Vendor
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {vendors.length}
                </h3>
                <p className="text-gray-600">Total Vendors</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-green-600">
                  ${totalCreditLimit.toLocaleString()}
                </h3>
                <p className="text-gray-600">Total Credit Limit</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-red-600">
                  ${totalOutstanding.toLocaleString()}
                </h3>
                <p className="text-gray-600">Outstanding Balance</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-purple-600">
                  {averagePaymentRate.toFixed(1)}%
                </h3>
                <p className="text-gray-600">Avg On-Time Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={productTypeFilter}
            onChange={(e) => setProductTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Product Types</option>
            <option value="feed">Feed</option>
            <option value="medicine">Medicine</option>
            <option value="equipment">Equipment</option>
            <option value="supplies">Supplies</option>
          </select>
          <select
            value={creditStatusFilter}
            onChange={(e) => setCreditStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Credit Status</option>
            <option value="low">Low Usage (&lt;30%)</option>
            <option value="medium">Medium Usage (30-70%)</option>
            <option value="high">High Usage (&gt;70%)</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vendor.email && (
                        <div className="flex items-center mb-1">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {vendor.email}
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {vendor.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {vendor.productTypes.map((type) => (
                        <span
                          key={type}
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex justify-between">
                        <span>Limit:</span>
                        <span className="font-medium">
                          ${vendor.creditLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Balance:</span>
                        <span
                          className={`font-medium ${getCreditStatusColor(vendor)}`}
                        >
                          ${vendor.creditBalance.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full ${
                            (vendor.creditBalance / vendor.creditLimit) * 100 >=
                            90
                              ? 'bg-red-500'
                              : (vendor.creditBalance / vendor.creditLimit) *
                                    100 >=
                                  70
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min((vendor.creditBalance / vendor.creditLimit) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{vendor.paymentTerms} days</div>
                    {vendor.earlyPaymentDiscount && (
                      <div className="text-green-600">
                        {vendor.earlyPaymentDiscount}% early discount
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-gray-900">
                      On-time: {vendor.onTimePaymentRate}%
                    </div>
                    <div className="text-gray-500">
                      Total: ${vendor.totalPurchases.toLocaleString()}
                    </div>
                    <div className="text-gray-500">
                      Last order:{' '}
                      {vendor.lastOrder?.toLocaleDateString() || 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {vendor.creditBalance > 0 && (
                        <button
                          onClick={() => openPaymentModal(vendor)}
                          className="text-green-600 hover:text-green-900"
                          title="Make Payment"
                        >
                          <CurrencyDollarIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openModal(vendor)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Vendor"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Vendor"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
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
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Credit Limit *
                    </label>
                    <input
                      type="number"
                      value={formData.creditLimit || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          creditLimit: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Terms (Days) *
                    </label>
                    <select
                      value={formData.paymentTerms || 30}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentTerms: parseInt(e.target.value),
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value={15}>15 days</option>
                      <option value={30}>30 days</option>
                      <option value={45}>45 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Early Payment Discount (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.earlyPaymentDiscount || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          earlyPaymentDiscount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Types *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        'feed',
                        'medicine',
                        'equipment',
                        'supplies',
                      ] as ProductType[]
                    ).map((type) => (
                      <div key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          id={type}
                          checked={
                            formData.productTypes?.includes(type) || false
                          }
                          onChange={() => toggleProductType(type)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={type}
                          className="ml-2 block text-sm text-gray-900 capitalize"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

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
                    Vendor is active
                  </label>
                </div>

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
                    {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedVendorForPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Make Payment - {selectedVendorForPayment.companyName}
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Outstanding Balance:</span>
                    <span className="text-lg font-bold text-red-600">
                      ${selectedVendorForPayment.creditBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Terms:</span>
                    <span className="font-medium">
                      {selectedVendorForPayment.paymentTerms} days
                    </span>
                  </div>
                  {selectedVendorForPayment.earlyPaymentDiscount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Early Payment Discount:
                      </span>
                      <span className="font-medium text-green-600">
                        {selectedVendorForPayment.earlyPaymentDiscount}%
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(parseFloat(e.target.value) || 0)
                    }
                    max={selectedVendorForPayment.creditBalance}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(
                          selectedVendorForPayment.creditBalance * 0.25,
                        )
                      }
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(
                          selectedVendorForPayment.creditBalance * 0.5,
                        )
                      }
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(
                          selectedVendorForPayment.creditBalance * 0.75,
                        )
                      }
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentAmount(selectedVendorForPayment.creditBalance)
                      }
                      className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded"
                    >
                      Full
                    </button>
                  </div>
                </div>

                {selectedVendorForPayment.earlyPaymentDiscount &&
                  paymentAmount === selectedVendorForPayment.creditBalance && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <div className="text-green-800 font-medium">
                            Early Payment Discount Available!
                          </div>
                          <div className="text-green-600 text-sm">
                            Save $
                            {(
                              (paymentAmount *
                                selectedVendorForPayment.earlyPaymentDiscount) /
                              100
                            ).toFixed(2)}
                            ({selectedVendorForPayment.earlyPaymentDiscount}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={
                      paymentAmount <= 0 ||
                      paymentAmount > selectedVendorForPayment.creditBalance
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Process Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
