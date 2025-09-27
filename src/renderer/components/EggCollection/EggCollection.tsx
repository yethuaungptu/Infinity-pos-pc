import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  EggCollection,
  Customer,
  CollectionRoute,
  Staff,
} from '../../types/core';

import { posService } from '../../services/posService';
import { eggCollectionService } from '../../services/eggCollectionService';
import { notificationService } from '../../services/notificationService';
import { printService } from '../../services/printService';

const EggCollectionComponent: React.FC = () => {
  const [collections, setCollections] = useState<EggCollection[]>([]);
  const [farmers, setFarmers] = useState<Customer[]>([]);
  const [routes, setRoutes] = useState<CollectionRoute[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<EggCollection | null>(null);

  // Form state for new collection
  const [formData, setFormData] = useState({
    farmerId: '',
    routeId: '',
    staffId: '',
    henEggs: {
      small: 0,
      medium: 0,
      large: 0,
      extraLarge: 0,
      damaged: 0,
    },
    duckEggs: {
      small: 0,
      medium: 0,
      large: 0,
      damaged: 0,
    },
    henEggPrice: 2.5, // per dozen
    duckEggPrice: 4.0, // per dozen
    qualityNotes: '',
  });

  // Current market prices (could be fetched from API)
  const [marketPrices, setMarketPrices] = useState({
    henEggs: 2.5,
    duckEggs: 4.0,
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockFarmers: Customer[] = [
      {
        id: '1',
        type: 'farmer',
        contactPerson: 'John Farm',
        businessName: 'Happy Hen Farm',
        phone: '+1-555-0301',
        creditLimit: 10000,
        creditBalance: 2500,
        paymentTerms: 30,
        creditStatus: 'current',
        farmSize: 50,
        animalTypes: ['poultry'],
        eggProduction: {
          henEggs: 120,
          duckEggs: 30,
          collectionSchedule: 'daily',
        },
        totalPurchases: 25000,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date(),
        active: true,
      },
      {
        id: '2',
        type: 'farmer',
        contactPerson: 'Sarah Poultry',
        businessName: 'Golden Egg Ranch',
        phone: '+1-555-0302',
        creditLimit: 15000,
        creditBalance: 3200,
        paymentTerms: 45,
        creditStatus: 'current',
        farmSize: 75,
        animalTypes: ['poultry'],
        eggProduction: {
          henEggs: 180,
          duckEggs: 45,
          collectionSchedule: 'daily',
        },
        totalPurchases: 35000,
        createdAt: new Date('2023-02-10'),
        updatedAt: new Date(),
        active: true,
      },
    ];

    const mockRoutes: CollectionRoute[] = [
      {
        id: '1',
        name: 'North Route',
        description: 'Northern farms collection route',
        farmerIds: ['1'],
        estimatedTime: 180, // 3 hours
        distance: 25,
        staffId: 'staff3',
        schedule: 'daily',
        active: true,
      },
      {
        id: '2',
        name: 'South Route',
        description: 'Southern farms collection route',
        farmerIds: ['2'],
        estimatedTime: 240, // 4 hours
        distance: 35,
        staffId: 'staff3',
        schedule: 'daily',
        active: true,
      },
    ];

    const mockStaff: Staff[] = [
      {
        id: 'staff3',
        employeeId: 'EMP003',
        firstName: 'Mike',
        lastName: 'Collector',
        position: 'collector',
        department: 'collection',
        hireDate: new Date('2023-05-10'),
        salary: 2800,
        permissions: ['egg_collection'],
        username: 'mike.collector',
        active: true,
        createdAt: new Date('2023-05-10'),
        updatedAt: new Date(),
      },
    ];

    const mockCollections: EggCollection[] = [
      {
        id: '1',
        farmerId: '1',
        collectionDate: new Date(),
        routeId: '1',
        staffId: 'staff3',
        henEggs: {
          small: 24,
          medium: 48,
          large: 36,
          extraLarge: 12,
          damaged: 6,
        },
        duckEggs: {
          small: 12,
          medium: 18,
          large: 6,
          damaged: 2,
        },
        henEggPrice: 2.5,
        duckEggPrice: 4.0,
        totalHenEggs: 120,
        totalDuckEggs: 36,
        totalValue: 37.0,
        qualityNotes: 'Good quality, minimal damage',
        synced: true,
      },
    ];

    setFarmers(mockFarmers);
    setRoutes(mockRoutes);
    setStaff(mockStaff);
    setCollections(mockCollections);
  }, []);

  const openModal = (collection?: EggCollection) => {
    if (collection) {
      setEditingCollection(collection);
      const farmer = farmers.find((f) => f.id === collection.farmerId);
      setFormData({
        farmerId: collection.farmerId,
        routeId: collection.routeId || '',
        staffId: collection.staffId,
        henEggs: collection.henEggs,
        duckEggs: collection.duckEggs,
        henEggPrice: collection.henEggPrice,
        duckEggPrice: collection.duckEggPrice,
        qualityNotes: collection.qualityNotes || '',
      });
    } else {
      setEditingCollection(null);
      setFormData({
        farmerId: '',
        routeId: '',
        staffId: '',
        henEggs: { small: 0, medium: 0, large: 0, extraLarge: 0, damaged: 0 },
        duckEggs: { small: 0, medium: 0, large: 0, damaged: 0 },
        henEggPrice: marketPrices.henEggs,
        duckEggPrice: marketPrices.duckEggs,
        qualityNotes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCollection(null);
  };

  const calculateTotals = () => {
    const totalHenEggs = Object.values(formData.henEggs).reduce(
      (sum, count) => sum + count,
      0,
    );
    const totalDuckEggs = Object.values(formData.duckEggs).reduce(
      (sum, count) => sum + count,
      0,
    );

    // Calculate dozens
    const henDozens = totalHenEggs / 12;
    const duckDozens = totalDuckEggs / 12;

    // Calculate value
    const henValue = henDozens * formData.henEggPrice;
    const duckValue = duckDozens * formData.duckEggPrice;
    const totalValue = henValue + duckValue;

    return {
      totalHenEggs,
      totalDuckEggs,
      henDozens: henDozens.toFixed(1),
      duckDozens: duckDozens.toFixed(1),
      henValue,
      duckValue,
      totalValue,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totals = calculateTotals();

    try {
      if (editingCollection) {
        // Update existing collection
        const updatedCollection: EggCollection = {
          ...editingCollection,
          ...formData,
          totalHenEggs: totals.totalHenEggs,
          totalDuckEggs: totals.totalDuckEggs,
          totalValue: totals.totalValue,
        };

        setCollections((prev) =>
          prev.map((c) =>
            c.id === editingCollection.id ? updatedCollection : c,
          ),
        );
        console.log('Updated collection:', updatedCollection);
      } else {
        // Create new collection
        const newCollection: EggCollection = {
          id: Date.now().toString(),
          ...formData,
          collectionDate: new Date(),
          totalHenEggs: totals.totalHenEggs,
          totalDuckEggs: totals.totalDuckEggs,
          totalValue: totals.totalValue,
          synced: false,
        };

        setCollections((prev) => [...prev, newCollection]);
        console.log('Created collection:', newCollection);

        // Update farmer's account (add credit for eggs)
        const farmer = farmers.find((f) => f.id === formData.farmerId);
        if (farmer) {
          const updatedFarmer = {
            ...farmer,
            creditBalance: farmer.creditBalance - totals.totalValue, // Reduce debt
            totalEggSales: (farmer.totalEggSales || 0) + totals.totalValue,
            updatedAt: new Date(),
          };
          setFarmers((prev) =>
            prev.map((f) => (f.id === farmer.id ? updatedFarmer : f)),
          );
        }
      }

      closeModal();
      alert(
        editingCollection
          ? 'Collection updated successfully!'
          : 'Collection recorded successfully!',
      );
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection. Please try again.');
    }
  };

  const filteredCollections = collections.filter((collection) => {
    const collectionDate = collection.collectionDate
      .toISOString()
      .split('T')[0];
    const matchesDate = collectionDate === selectedDate;
    const matchesRoute =
      selectedRoute === 'all' || collection.routeId === selectedRoute;
    const matchesStaff =
      selectedStaff === 'all' || collection.staffId === selectedStaff;

    return matchesDate && matchesRoute && matchesStaff;
  });

  const dailyTotals = filteredCollections.reduce(
    (totals, collection) => ({
      henEggs: totals.henEggs + collection.totalHenEggs,
      duckEggs: totals.duckEggs + collection.totalDuckEggs,
      totalValue: totals.totalValue + collection.totalValue,
      collections: totals.collections + 1,
    }),
    { henEggs: 0, duckEggs: 0, totalValue: 0, collections: 0 },
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Egg Collection</h1>
            <p className="text-gray-600">
              Collect eggs from farms and manage routes
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Record Collection
          </button>
        </div>

        {/* Market Prices */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-yellow-800 mb-2">
            Today's Market Prices
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-yellow-700">Hen Eggs:</span>
              <span className="font-medium text-yellow-800">
                ${marketPrices.henEggs}/dozen
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-700">Duck Eggs:</span>
              <span className="font-medium text-yellow-800">
                ${marketPrices.duckEggs}/dozen
              </span>
            </div>
          </div>
        </div>

        {/* Daily Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                🥚
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {dailyTotals.henEggs}
                </h3>
                <p className="text-gray-600">Hen Eggs Collected</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                🦆
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {dailyTotals.duckEggs}
                </h3>
                <p className="text-gray-600">Duck Eggs Collected</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-green-600">
                  ${dailyTotals.totalValue.toFixed(2)}
                </h3>
                <p className="text-gray-600">Total Value</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-purple-600">
                  {dailyTotals.collections}
                </h3>
                <p className="text-gray-600">Collections</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Routes</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collector
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Collectors</option>
              {staff
                .filter((s) => s.permissions.includes('egg_collection'))
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route & Collector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hen Eggs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duck Eggs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
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
              {filteredCollections.map((collection) => {
                const farmer = farmers.find(
                  (f) => f.id === collection.farmerId,
                );
                const route = routes.find((r) => r.id === collection.routeId);
                const collector = staff.find(
                  (s) => s.id === collection.staffId,
                );

                return (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            🚜
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {farmer?.businessName || farmer?.contactPerson}
                          </div>
                          <div className="text-sm text-gray-500">
                            {farmer?.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {route?.name || 'Direct'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {collector?.firstName} {collector?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span>S: {collection.henEggs.small}</span>
                          <span>M: {collection.henEggs.medium}</span>
                          <span>L: {collection.henEggs.large}</span>
                          <span>XL: {collection.henEggs.extraLarge}</span>
                        </div>
                        <div className="font-medium mt-1">
                          Total: {collection.totalHenEggs}
                        </div>
                        {collection.henEggs.damaged > 0 && (
                          <div className="text-red-500 text-xs">
                            Damaged: {collection.henEggs.damaged}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <span>S: {collection.duckEggs.small}</span>
                          <span>M: {collection.duckEggs.medium}</span>
                          <span>L: {collection.duckEggs.large}</span>
                          <span></span>
                        </div>
                        <div className="font-medium mt-1">
                          Total: {collection.totalDuckEggs}
                        </div>
                        {collection.duckEggs.damaged > 0 && (
                          <div className="text-red-500 text-xs">
                            Damaged: {collection.duckEggs.damaged}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        ${collection.totalValue.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        H: ${collection.henEggPrice}/dz | D: $
                        {collection.duckEggPrice}/dz
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {collection.qualityNotes ? (
                          <span className="text-green-600">✓ Notes</span>
                        ) : (
                          <span className="text-gray-400">No notes</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          collection.synced
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {collection.synced ? 'Synced' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(collection)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View/Edit Collection"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingCollection
                    ? 'Edit Collection'
                    : 'Record New Collection'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Farm *
                    </label>
                    <select
                      value={formData.farmerId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          farmerId: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Farm</option>
                      {farmers
                        .filter((f) => f.type === 'farmer')
                        .map((farmer) => (
                          <option key={farmer.id} value={farmer.id}>
                            {farmer.businessName || farmer.contactPerson}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Route
                    </label>
                    <select
                      value={formData.routeId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          routeId: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Direct Collection</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Collector *
                    </label>
                    <select
                      value={formData.staffId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          staffId: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Collector</option>
                      {staff
                        .filter((s) => s.permissions.includes('egg_collection'))
                        .map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Hen Eggs */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    🐔 Hen Eggs Collection
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      (Price: ${formData.henEggPrice}/dozen)
                    </span>
                  </h4>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Small
                      </label>
                      <input
                        type="number"
                        value={formData.henEggs.small}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            henEggs: {
                              ...prev.henEggs,
                              small: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Medium
                      </label>
                      <input
                        type="number"
                        value={formData.henEggs.medium}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            henEggs: {
                              ...prev.henEggs,
                              medium: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Large
                      </label>
                      <input
                        type="number"
                        value={formData.henEggs.large}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            henEggs: {
                              ...prev.henEggs,
                              large: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Extra Large
                      </label>
                      <input
                        type="number"
                        value={formData.henEggs.extraLarge}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            henEggs: {
                              ...prev.henEggs,
                              extraLarge: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700">
                        Damaged
                      </label>
                      <input
                        type="number"
                        value={formData.henEggs.damaged}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            henEggs: {
                              ...prev.henEggs,
                              damaged: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-red-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Duck Eggs */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    🦆 Duck Eggs Collection
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      (Price: ${formData.duckEggPrice}/dozen)
                    </span>
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Small
                      </label>
                      <input
                        type="number"
                        value={formData.duckEggs.small}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            duckEggs: {
                              ...prev.duckEggs,
                              small: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Medium
                      </label>
                      <input
                        type="number"
                        value={formData.duckEggs.medium}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            duckEggs: {
                              ...prev.duckEggs,
                              medium: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Large
                      </label>
                      <input
                        type="number"
                        value={formData.duckEggs.large}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            duckEggs: {
                              ...prev.duckEggs,
                              large: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-red-700">
                        Damaged
                      </label>
                      <input
                        type="number"
                        value={formData.duckEggs.damaged}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            duckEggs: {
                              ...prev.duckEggs,
                              damaged: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        className="mt-1 block w-full border border-red-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hen Egg Price (per dozen)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.henEggPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          henEggPrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duck Egg Price (per dozen)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.duckEggPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          duckEggPrice: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Quality Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quality Notes
                  </label>
                  <textarea
                    value={formData.qualityNotes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        qualityNotes: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Notes about egg quality, condition, or any issues..."
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Collection Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Hen Eggs:</span>
                      <div className="font-medium">
                        {calculateTotals().totalHenEggs} eggs (
                        {calculateTotals().henDozens} dozen)
                      </div>
                      <div className="text-green-600">
                        ${calculateTotals().henValue.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Duck Eggs:</span>
                      <div className="font-medium">
                        {calculateTotals().totalDuckEggs} eggs (
                        {calculateTotals().duckDozens} dozen)
                      </div>
                      <div className="text-green-600">
                        ${calculateTotals().duckValue.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Value:</span>
                      <div className="text-lg font-bold text-green-600">
                        ${calculateTotals().totalValue.toFixed(2)}
                      </div>
                    </div>
                  </div>
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
                    {editingCollection
                      ? 'Update Collection'
                      : 'Record Collection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EggCollectionComponent;
