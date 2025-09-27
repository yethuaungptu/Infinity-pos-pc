import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Staff, StaffPermission } from '../../types/core';

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedStaffForPermissions, setSelectedStaffForPermissions] =
    useState<Staff | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Staff>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: 'cashier',
    department: 'sales',
    salary: 0,
    username: '',
    permissions: [],
    active: true,
  });

  // Available permissions with descriptions
  const availablePermissions: Array<{
    key: StaffPermission;
    label: string;
    description: string;
    category: 'sales' | 'inventory' | 'financial' | 'admin';
  }> = [
    {
      key: 'pos_sales',
      label: 'POS Sales',
      description: 'Make sales transactions',
      category: 'sales',
    },
    {
      key: 'inventory_manage',
      label: 'Inventory Management',
      description: 'Manage products and stock',
      category: 'inventory',
    },
    {
      key: 'customer_manage',
      label: 'Customer Management',
      description: 'Manage customer accounts',
      category: 'sales',
    },
    {
      key: 'egg_collection',
      label: 'Egg Collection',
      description: 'Collect eggs from farms',
      category: 'inventory',
    },
    {
      key: 'vendor_manage',
      label: 'Vendor Management',
      description: 'Manage supplier accounts',
      category: 'financial',
    },
    {
      key: 'reports_view',
      label: 'View Reports',
      description: 'View business reports',
      category: 'financial',
    },
    {
      key: 'reports_export',
      label: 'Export Reports',
      description: 'Export reports to files',
      category: 'financial',
    },
    {
      key: 'credit_approve',
      label: 'Credit Approval',
      description: 'Approve credit transactions',
      category: 'financial',
    },
    {
      key: 'cash_handle',
      label: 'Cash Handling',
      description: 'Handle cash transactions',
      category: 'financial',
    },
    {
      key: 'settings_manage',
      label: 'System Settings',
      description: 'Configure system settings',
      category: 'admin',
    },
    {
      key: 'staff_manage',
      label: 'Staff Management',
      description: 'Manage other staff members',
      category: 'admin',
    },
  ];

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockStaff: Staff[] = [
      {
        id: '1',
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Manager',
        email: 'john@agripos.com',
        phone: '+1-555-0101',
        position: 'manager',
        department: 'admin',
        hireDate: new Date('2023-01-15'),
        salary: 5000,
        permissions: [
          'pos_sales',
          'inventory_manage',
          'customer_manage',
          'reports_view',
          'credit_approve',
          'settings_manage',
          'staff_manage',
        ],
        username: 'john.manager',
        lastLogin: new Date(),
        active: true,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date(),
      },
      {
        id: '2',
        employeeId: 'EMP002',
        firstName: 'Sarah',
        lastName: 'Cashier',
        email: 'sarah@agripos.com',
        phone: '+1-555-0102',
        position: 'cashier',
        department: 'sales',
        hireDate: new Date('2023-03-20'),
        salary: 2500,
        permissions: ['pos_sales', 'customer_manage', 'cash_handle'],
        username: 'sarah.cashier',
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        active: true,
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date(),
      },
      {
        id: '3',
        employeeId: 'EMP003',
        firstName: 'Mike',
        lastName: 'Collector',
        email: 'mike@agripos.com',
        phone: '+1-555-0103',
        position: 'collector',
        department: 'collection',
        hireDate: new Date('2023-05-10'),
        salary: 2800,
        permissions: ['egg_collection', 'customer_manage'],
        collectionRoutes: ['Route A', 'Route B'],
        performanceMetrics: {
          totalCollections: 145,
          averageQuality: 4.2,
          onTimeRate: 95,
        },
        username: 'mike.collector',
        lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        active: true,
        createdAt: new Date('2023-05-10'),
        updatedAt: new Date(),
      },
    ];

    setStaff(mockStaff);
  }, []);

  const openModal = (staffMember?: Staff) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({ ...staffMember });
    } else {
      setEditingStaff(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: 'cashier',
        department: 'sales',
        salary: 0,
        username: '',
        permissions: [],
        active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFormData({});
  };

  const openPermissionsModal = (staffMember: Staff) => {
    setSelectedStaffForPermissions(staffMember);
    setShowPermissionsModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingStaff) {
        // Update existing staff
        const updatedStaff = {
          ...editingStaff,
          ...formData,
          updatedAt: new Date(),
        } as Staff;

        setStaff((prev) =>
          prev.map((s) => (s.id === editingStaff.id ? updatedStaff : s)),
        );
        console.log('Updated staff:', updatedStaff);
      } else {
        // Create new staff
        const newStaff: Staff = {
          id: Date.now().toString(),
          employeeId: `EMP${String(staff.length + 1).padStart(3, '0')}`,
          ...(formData as Staff),
          hireDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setStaff((prev) => [...prev, newStaff]);
        console.log('Created staff:', newStaff);
      }

      closeModal();
      alert(
        editingStaff
          ? 'Staff updated successfully!'
          : 'Staff created successfully!',
      );
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('Failed to save staff. Please try again.');
    }
  };

  const handleDelete = async (staffId: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        setStaff((prev) => prev.filter((s) => s.id !== staffId));
        console.log('Deleted staff:', staffId);
        alert('Staff deleted successfully!');
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Failed to delete staff. Please try again.');
      }
    }
  };

  const togglePermission = (permission: StaffPermission) => {
    if (!selectedStaffForPermissions) return;

    const currentPermissions = selectedStaffForPermissions.permissions;
    const hasPermission = currentPermissions.includes(permission);

    const newPermissions = hasPermission
      ? currentPermissions.filter((p) => p !== permission)
      : [...currentPermissions, permission];

    const updatedStaff = {
      ...selectedStaffForPermissions,
      permissions: newPermissions,
      updatedAt: new Date(),
    };

    setStaff((prev) =>
      prev.map((s) =>
        s.id === selectedStaffForPermissions.id ? updatedStaff : s,
      ),
    );
    setSelectedStaffForPermissions(updatedStaff);
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      `${member.firstName} ${member.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === 'all' || member.department === departmentFilter;
    const matchesPosition =
      positionFilter === 'all' || member.position === positionFilter;

    return matchesSearch && matchesDepartment && matchesPosition;
  });

  const generateUsername = (firstName: string, lastName: string) => {
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    setFormData((prev) => ({ ...prev, username }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Staff Management
            </h1>
            <p className="text-gray-600">
              Manage team members and their permissions
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Staff Member
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {staff.length}
                </h3>
                <p className="text-gray-600">Total Staff</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-green-600">
                  {staff.filter((s) => s.active).length}
                </h3>
                <p className="text-gray-600">Active Staff</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <MapPinIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-purple-600">
                  {staff.filter((s) => s.position === 'collector').length}
                </h3>
                <p className="text-gray-600">Collectors</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-yellow-600">
                  $
                  {staff.reduce((sum, s) => sum + s.salary, 0).toLocaleString()}
                </h3>
                <p className="text-gray-600">Total Payroll</p>
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
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            <option value="sales">Sales</option>
            <option value="collection">Collection</option>
            <option value="inventory">Inventory</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Positions</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="collector">Collector</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position & Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
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
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {member.position}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {member.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.email}</div>
                    <div className="text-sm text-gray-500">{member.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.position === 'collector' &&
                    member.performanceMetrics ? (
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Collections:{' '}
                          {member.performanceMetrics.totalCollections}
                        </div>
                        <div className="text-gray-500">
                          Quality: {member.performanceMetrics.averageQuality}/5
                        </div>
                        <div className="text-gray-500">
                          On-time: {member.performanceMetrics.onTimeRate}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">
                        ${member.salary.toLocaleString()}/month
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.lastLogin
                      ? member.lastLogin.toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openPermissionsModal(member)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Manage Permissions"
                      >
                        <ShieldCheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openModal(member)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Staff"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Staff"
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

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }));
                        if (formData.lastName) {
                          generateUsername(e.target.value, formData.lastName);
                        }
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }));
                        if (formData.firstName) {
                          generateUsername(formData.firstName, e.target.value);
                        }
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

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
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
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
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position *
                    </label>
                    <select
                      value={formData.position || 'cashier'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          position: e.target.value as any,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="collector">Collector</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department *
                    </label>
                    <select
                      value={formData.department || 'sales'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          department: e.target.value as any,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="sales">Sales</option>
                      <option value="collection">Collection</option>
                      <option value="inventory">Inventory</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Monthly Salary *
                    </label>
                    <input
                      type="number"
                      value={formData.salary || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          salary: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
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
                    Staff member is active
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
                    {editingStaff ? 'Update Staff' : 'Create Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedStaffForPermissions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Permissions - {selectedStaffForPermissions.firstName}{' '}
                  {selectedStaffForPermissions.lastName}
                </h3>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Permissions by Category */}
                {['sales', 'inventory', 'financial', 'admin'].map(
                  (category) => (
                    <div
                      key={category}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">
                        {category} Permissions
                      </h4>
                      <div className="space-y-3">
                        {availablePermissions
                          .filter((perm) => perm.category === category)
                          .map((permission) => (
                            <div
                              key={permission.key}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={permission.key}
                                  checked={selectedStaffForPermissions.permissions.includes(
                                    permission.key,
                                  )}
                                  onChange={() =>
                                    togglePermission(permission.key)
                                  }
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div className="ml-3">
                                  <label
                                    htmlFor={permission.key}
                                    className="text-sm font-medium text-gray-700"
                                  >
                                    {permission.label}
                                  </label>
                                  <p className="text-sm text-gray-500">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
