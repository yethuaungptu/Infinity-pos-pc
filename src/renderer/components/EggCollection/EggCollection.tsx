import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  TruckIcon,
  EyeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import {
  EggCollection,
  Customer,
  CollectionRoute,
  Staff,
  EggInventory,
  EggDelivery,
  DeliveryStatus,
  PaymentMethod,
} from '../../types/core';

const EggCollectionComponent: React.FC = () => {
  const [collections, setCollections] = useState<EggCollection[]>([]);
  const [farmers, setFarmers] = useState<Customer[]>([]);
  const [routes, setRoutes] = useState<CollectionRoute[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [wholesaleCustomers, setWholesaleCustomers] = useState<Customer[]>([]);
  const [eggInventory, setEggInventory] = useState<EggInventory | null>(null);
  const [deliveries, setDeliveries] = useState<EggDelivery[]>([]);
  const [activeTab, setActiveTab] = useState<
    'collections' | 'routes' | 'inventory'
  >('collections');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<EggCollection | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<CollectionRoute | null>(
    null,
  );
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [editingDelivery, setEditingDelivery] =
    useState<EggDelivery | null>(null);
  const [routeSaving, setRouteSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [routeForm, setRouteForm] = useState({
    name: '',
    description: '',
    farmerIds: [] as string[],
    estimatedTime: 0,
    distance: 0,
    staffId: '',
    schedule: 'DAILY' as CollectionRoute['schedule'],
    active: true,
  });

  const [deliveryForm, setDeliveryForm] = useState({
    customerId: '',
    staffId: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    status: 'SCHEDULED' as DeliveryStatus,
    henEggs: {
      small: 0,
      medium: 0,
      large: 0,
      extraLarge: 0,
    },
    duckEggs: {
      small: 0,
      medium: 0,
      large: 0,
    },
    henEggPrice: 0,
    duckEggPrice: 0,
    paid: false,
    paymentMethod: 'CASH' as PaymentMethod,
    notes: '',
  });

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

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [
          farmerResults,
          wholesaleResults,
          routeResults,
          staffResults,
          prices,
          inventory,
        ] = await Promise.all([
          window.api.getCustomerByType('FARMER'),
          window.api.getCustomerByType('WHOLESALE'),
          window.api.getCollectionRoutes(),
          window.api.getStaffs(),
          window.api.getMarketPrices(),
          window.api.getEggInventory(),
        ]);

        if (!isMounted) return;
        setFarmers(farmerResults);
        setRoutes(routeResults);
        setStaff(staffResults);
        setWholesaleCustomers(wholesaleResults);
        setEggInventory(inventory);
        setMarketPrices({
          henEggs: prices.henEggs.large,
          duckEggs: prices.duckEggs.large,
        });
        setDeliveryForm((prev) => ({
          ...prev,
          henEggPrice: Math.round(prices.henEggs.large),
          duckEggPrice: Math.round(prices.duckEggs.large),
        }));
      } catch (error) {
        console.error('Failed to load egg collection data:', error);
        if (isMounted) {
          setErrorMessage('Failed to load egg collection data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCollections = async () => {
      setLoadingCollections(true);
      setErrorMessage(null);

      const startOfDay = new Date(`${selectedDate}T00:00:00`);
      const endOfDay = new Date(`${selectedDate}T23:59:59`);

      try {
        const results = await window.api.getEggCollections({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          routeId: selectedRoute !== 'all' ? selectedRoute : undefined,
          staffId: selectedStaff !== 'all' ? selectedStaff : undefined,
        });

        if (!isMounted) return;

        const normalized = results.map((collection) => ({
          ...collection,
          collectionDate: new Date(collection.collectionDate),
        }));
        console.log('Loaded collections:', normalized);
        setCollections(normalized);
      } catch (error) {
        console.error('Failed to load collections:', error);
        if (isMounted) {
          setErrorMessage('Failed to load collections for the selected date.');
        }
      } finally {
        if (isMounted) {
          setLoadingCollections(false);
        }
      }
    };

    loadCollections();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedRoute, selectedStaff]);

  useEffect(() => {
    let isMounted = true;

    const loadDeliveries = async () => {
      setLoadingDeliveries(true);
      setErrorMessage(null);

      const startOfDay = new Date(`${selectedDate}T00:00:00`);
      const endOfDay = new Date(`${selectedDate}T23:59:59`);

      try {
        const results = await window.api.getEggDeliveries({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
        });

        if (!isMounted) return;
        const normalized = results.map((delivery: EggDelivery) => ({
          ...delivery,
          deliveryDate: new Date(delivery.deliveryDate),
          createdAt: new Date(delivery.createdAt),
          updatedAt: new Date(delivery.updatedAt),
        }));
        setDeliveries(normalized);
      } catch (error) {
        console.error('Failed to load deliveries:', error);
        if (isMounted) {
          setErrorMessage('Failed to load deliveries for the selected date.');
        }
      } finally {
        if (isMounted) setLoadingDeliveries(false);
      }
    };

    loadDeliveries();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const openModal = (collection?: EggCollection) => {
    if (collection) {
      setEditingCollection(collection);
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

  const openRouteModal = (route?: CollectionRoute) => {
    if (route) {
      setEditingRoute(route);
      setRouteForm({
        name: route.name,
        description: route.description || '',
        farmerIds: route.farmerIds || [],
        estimatedTime: route.estimatedTime,
        distance: route.distance,
        staffId: route.staffId || '',
        schedule: route.schedule,
        active: route.active,
      });
    } else {
      setEditingRoute(null);
      setRouteForm({
        name: '',
        description: '',
        farmerIds: [],
        estimatedTime: 0,
        distance: 0,
        staffId: '',
        schedule: 'DAILY',
        active: true,
      });
    }
    setShowRouteModal(true);
  };

  const closeRouteModal = () => {
    setShowRouteModal(false);
    setEditingRoute(null);
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteSaving(true);
    setErrorMessage(null);
    try {
      if (editingRoute) {
        const updated = await window.api.updateCollectionRoute({
          ...routeForm,
          id: editingRoute.id,
        });
        setRoutes((prev) =>
          prev.map((route) => (route.id === updated.id ? updated : route)),
        );
      } else {
        const created = await window.api.createCollectionRoute(routeForm);
        setRoutes((prev) => [...prev, created]);
      }
      closeRouteModal();
    } catch (error) {
      console.error('Failed to save collection route:', error);
      setErrorMessage('Failed to save collection route.');
    } finally {
      setRouteSaving(false);
    }
  };

  const handleRouteDelete = async (routeId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this route?',
    );
    if (!confirmed) return;
    setErrorMessage(null);
    try {
      await window.api.deleteCollectionRoute(routeId);
      setRoutes((prev) => prev.filter((route) => route.id !== routeId));
      if (selectedRoute === routeId) {
        setSelectedRoute('all');
      }
    } catch (error) {
      console.error('Failed to delete route:', error);
      setErrorMessage('Failed to delete collection route.');
    }
  };

  const handleMarkPaid = async (collection: EggCollection) => {
    const confirmed = window.confirm(
      `Mark this collection as paid for ${Math.round(collection.totalValue).toLocaleString()} MMK?`,
    );
    if (!confirmed) return;
    setErrorMessage(null);
    try {
      const staff: any = await window.api.check();
      const updated = await window.api.markEggCollectionPaid({
        id: collection.id,
        staffId: staff.id,
      });
      setCollections((prev) =>
        prev.map((collection) =>
          collection.id === updated.id ? updated : collection,
        ),
      );
    } catch (error) {
      console.error('Failed to mark collection as paid:', error);
      setErrorMessage('Failed to mark collection as paid.');
    }
  };

  const openDeliveryModal = (delivery?: EggDelivery) => {
    if (delivery) {
      setEditingDelivery(delivery);
      setDeliveryForm({
        customerId: delivery.customerId,
        staffId: delivery.staffId || '',
        deliveryDate: delivery.deliveryDate.toISOString().split('T')[0],
        status: delivery.status,
        henEggs: { ...delivery.henEggs },
        duckEggs: { ...delivery.duckEggs },
        henEggPrice: delivery.henEggPrice,
        duckEggPrice: delivery.duckEggPrice,
        paid: delivery.paid,
        paymentMethod: delivery.paymentMethod || 'CASH',
        notes: delivery.notes || '',
      });
    } else {
      setEditingDelivery(null);
      setDeliveryForm((prev) => ({
        ...prev,
        customerId: '',
        staffId: '',
        deliveryDate: selectedDate,
        status: 'SCHEDULED',
        henEggs: { small: 0, medium: 0, large: 0, extraLarge: 0 },
        duckEggs: { small: 0, medium: 0, large: 0 },
        henEggPrice: marketPrices.henEggs,
        duckEggPrice: marketPrices.duckEggs,
        paid: false,
        paymentMethod: 'CASH',
        notes: '',
      }));
    }
    setShowDeliveryModal(true);
  };

  const closeDeliveryModal = () => {
    setShowDeliveryModal(false);
    setEditingDelivery(null);
  };

  const calculateDeliveryTotals = () => {
    const totalHenEggs = Object.values(deliveryForm.henEggs).reduce(
      (sum, count) => sum + count,
      0,
    );
    const totalDuckEggs = Object.values(deliveryForm.duckEggs).reduce(
      (sum, count) => sum + count,
      0,
    );

    const henDozens = totalHenEggs / 12;
    const duckDozens = totalDuckEggs / 12;

    const henValue = Math.round(henDozens * deliveryForm.henEggPrice);
    const duckValue = Math.round(duckDozens * deliveryForm.duckEggPrice);
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

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (editingDelivery) {
        const updated = await window.api.updateEggDelivery({
          id: editingDelivery.id,
          ...deliveryForm,
          deliveryDate: new Date(
            `${deliveryForm.deliveryDate}T00:00:00`,
          ).toISOString(),
        });
        setDeliveries((prev) =>
          prev.map((delivery) =>
            delivery.id === updated.id ? updated : delivery,
          ),
        );
      } else {
        const created = await window.api.createEggDelivery({
          ...deliveryForm,
          deliveryDate: new Date(
            `${deliveryForm.deliveryDate}T00:00:00`,
          ).toISOString(),
        });
        setDeliveries((prev) => [created, ...prev]);
      }

      const inventory = await window.api.getEggInventory();
      setEggInventory(inventory);
      closeDeliveryModal();
    } catch (error) {
      console.error('Failed to save delivery:', error);
      setErrorMessage('Failed to save delivery.');
    }
  };

  const handleDeliveryDelete = async (deliveryId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this delivery?',
    );
    if (!confirmed) return;

    setErrorMessage(null);
    try {
      await window.api.deleteEggDelivery(deliveryId);
      setDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));
    } catch (error) {
      console.error('Failed to delete delivery:', error);
      setErrorMessage('Failed to delete delivery.');
    }
  };

  const handleMarkDelivered = async (delivery: EggDelivery) => {
    const confirmed = window.confirm('Mark this delivery as delivered?');
    if (!confirmed) return;

    setErrorMessage(null);
    try {
      const updated = await window.api.updateEggDelivery({
        id: delivery.id,
        customerId: delivery.customerId,
        staffId: delivery.staffId,
        deliveryDate: delivery.deliveryDate.toISOString(),
        status: 'DELIVERED',
        henEggs: delivery.henEggs,
        duckEggs: delivery.duckEggs,
        henEggPrice: delivery.henEggPrice,
        duckEggPrice: delivery.duckEggPrice,
        paid: delivery.paid,
        paymentMethod: delivery.paymentMethod,
        notes: delivery.notes,
      });
      setDeliveries((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      const inventory = await window.api.getEggInventory();
      setEggInventory(inventory);
    } catch (error) {
      console.error('Failed to mark delivery as delivered:', error);
      setErrorMessage('Failed to mark delivery as delivered.');
    }
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
    const henValue = Math.round(henDozens * formData.henEggPrice);
    const duckValue = Math.round(duckDozens * formData.duckEggPrice);
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
        const updatedCollection = await window.api.updateEggCollection({
          ...editingCollection,
          ...formData,
          collectionDate: editingCollection.collectionDate,
          totalHenEggs: totals.totalHenEggs,
          totalDuckEggs: totals.totalDuckEggs,
          totalValue: totals.totalValue,
        });

        setCollections((prev) =>
          prev.map((c) =>
            c.id === editingCollection.id ? updatedCollection : c,
          ),
        );
      } else {
        const collectionDate = new Date(`${selectedDate}T00:00:00`);
        const newCollection = await window.api.createEggCollection({
          farmerId: formData.farmerId,
          routeId: formData.routeId || undefined,
          staffId: formData.staffId,
          collectionDate: collectionDate.toISOString(),
          henEggs: formData.henEggs,
          duckEggs: formData.duckEggs,
          henEggPrice: formData.henEggPrice,
          duckEggPrice: formData.duckEggPrice,
          qualityNotes: formData.qualityNotes,
        });

        setCollections((prev) => [newCollection, ...prev]);
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

    return matchesRoute && matchesStaff;
  });

  console.log('Filtered Collections:', filteredCollections);

  const dailyTotals = filteredCollections.reduce(
    (totals, collection) => ({
      henEggs: totals.henEggs + collection.totalHenEggs,
      duckEggs: totals.duckEggs + collection.totalDuckEggs,
      totalValue: totals.totalValue + collection.totalValue,
      collections: totals.collections + 1,
    }),
    { henEggs: 0, duckEggs: 0, totalValue: 0, collections: 0 },
  );

  const inventoryTotals = eggInventory
    ? {
        henTotal:
          eggInventory.henEggsSmall +
          eggInventory.henEggsMedium +
          eggInventory.henEggsLarge +
          eggInventory.henEggsExtraLarge,
        duckTotal:
          eggInventory.duckEggsSmall +
          eggInventory.duckEggsMedium +
          eggInventory.duckEggsLarge,
      }
    : { henTotal: 0, duckTotal: 0 };

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
          {activeTab === 'collections' && (
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Record Collection
            </button>
          )}
          {activeTab === 'routes' && (
            <button
              onClick={() => openRouteModal()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add New Collection Route
            </button>
          )}
          {activeTab === 'inventory' && (
            <button
              onClick={() => openDeliveryModal()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Schedule Delivery
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-3 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'collections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'routes'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Routes
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'inventory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Inventory & Deliveries
          </button>
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
          {activeTab === 'collections' && (
            <>
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
                    .filter((s) => s.department === 'COLLECTION')
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {(loading || loadingCollections) && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Loading egg collection data...
        </div>
      )}

      {loadingDeliveries && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Loading delivery data...
        </div>
      )}

      {activeTab === 'collections' && (
        <>
          {/* Market Prices */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-yellow-800 mb-2">
              Today's Market Prices
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span className="text-yellow-700">Hen Eggs:</span>
                <span className="font-medium text-yellow-800">
                  {Math.round(marketPrices.henEggs).toLocaleString()} MMK/dozen
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">Duck Eggs:</span>
                <span className="font-medium text-yellow-800">
                  {Math.round(marketPrices.duckEggs).toLocaleString()} MMK/dozen
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
                    {Math.round(dailyTotals.totalValue).toLocaleString()} MMK
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
        </>
      )}

      {activeTab === 'routes' && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Collection Routes
            </h2>
            <button
              onClick={() => openRouteModal()}
              className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Route
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Farms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collector
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
                {routes.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      No routes created yet.
                    </td>
                  </tr>
                )}
                {routes.map((route) => {
                  const collector = staff.find((s) => s.id === route.staffId);
                  const farmNames = route.farmerIds
                    .map(
                      (id) =>
                        farmers.find((f) => f.id === id)?.businessName ||
                        farmers.find((f) => f.id === id)?.contactPerson,
                    )
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {route.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {route.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {route.schedule}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {farmNames || 'No farms'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {collector
                          ? `${collector.firstName} ${collector.lastName}`
                          : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            route.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {route.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openRouteModal(route)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRouteDelete(route.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <>
          {/* Egg Inventory Summary */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Current Egg Inventory
              </h2>
              <span className="text-xs text-gray-500">
                Updated:{' '}
                {eggInventory?.updatedAt
                  ? new Date(eggInventory.updatedAt).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Hen Eggs
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    Total: {inventoryTotals.henTotal}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>Small: {eggInventory?.henEggsSmall || 0}</span>
                  <span>Medium: {eggInventory?.henEggsMedium || 0}</span>
                  <span>Large: {eggInventory?.henEggsLarge || 0}</span>
                  <span>XL: {eggInventory?.henEggsExtraLarge || 0}</span>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Duck Eggs
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    Total: {inventoryTotals.duckTotal}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <span>Small: {eggInventory?.duckEggsSmall || 0}</span>
                  <span>Medium: {eggInventory?.duckEggsMedium || 0}</span>
                  <span>Large: {eggInventory?.duckEggsLarge || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Egg Deliveries
            </h2>
            <button
              onClick={() => openDeliveryModal()}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Schedule Delivery
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eggs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveries.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      No deliveries scheduled for this date.
                    </td>
                  </tr>
                )}
                {deliveries.map((delivery) => {
                  const customer = wholesaleCustomers.find(
                    (c) => c.id === delivery.customerId,
                  );
                  return (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer?.businessName || customer?.contactPerson}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer?.phone || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(delivery.deliveryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        Hen: {delivery.totalHenEggs} | Duck:{' '}
                        {delivery.totalDuckEggs}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {Math.round(delivery.totalValue).toLocaleString()} MMK
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            delivery.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-800'
                              : delivery.status === 'IN_TRANSIT'
                                ? 'bg-blue-100 text-blue-800'
                                : delivery.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {delivery.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            delivery.paid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {delivery.paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {delivery.status !== 'DELIVERED' && (
                          <button
                            onClick={() => handleMarkDelivered(delivery)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Mark Delivered
                          </button>
                        )}
                        <button
                          onClick={() => openDeliveryModal(delivery)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeliveryDelete(delivery.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collections Table */}
      {activeTab === 'collections' && (
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
                          {Math.round(collection.totalValue).toLocaleString()} MMK
                        </div>
                        <div className="text-xs text-gray-500">
                          H: {Math.round(collection.henEggPrice).toLocaleString()}
                          MMK/dz | D:{' '}
                          {Math.round(collection.duckEggPrice).toLocaleString()}
                          MMK/dz
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
                            collection.paid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {collection.paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {!collection.paid && (
                          <button
                            onClick={() => handleMarkPaid(collection)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Paid"
                          >
                            Mark Paid
                          </button>
                        )}
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
      )}

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
                        .filter((f) => f.type === 'FARMER')
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
                        .filter((s) => s.department === 'COLLECTION')
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
                      (Price: {formData.henEggPrice.toLocaleString()} MMK/dozen)
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
                      (Price: {formData.duckEggPrice.toLocaleString()}{' '}
                      MMK/dozen)
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
                      Hen Egg Price (per dozen, MMK)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.henEggPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          henEggPrice:
                            Math.round(parseFloat(e.target.value)) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duck Egg Price (per dozen, MMK)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formData.duckEggPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          duckEggPrice:
                            Math.round(parseFloat(e.target.value)) || 0,
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
                        {calculateTotals().henValue.toLocaleString()} MMK
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Duck Eggs:</span>
                      <div className="font-medium">
                        {calculateTotals().totalDuckEggs} eggs (
                        {calculateTotals().duckDozens} dozen)
                      </div>
                      <div className="text-green-600">
                        {calculateTotals().duckValue.toLocaleString()} MMK
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Value:</span>
                      <div className="text-lg font-bold text-green-600">
                        {calculateTotals().totalValue.toLocaleString()} MMK
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

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingDelivery ? 'Edit Delivery' : 'Schedule Delivery'}
                </h3>
                <button
                  onClick={closeDeliveryModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleDeliverySubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Wholesale Customer *
                    </label>
                    <select
                      value={deliveryForm.customerId}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          customerId: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Customer</option>
                      {wholesaleCustomers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.businessName || customer.contactPerson}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Date *
                    </label>
                    <input
                      type="date"
                      value={deliveryForm.deliveryDate}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          deliveryDate: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={deliveryForm.status}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          status: e.target.value as DeliveryStatus,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assigned Staff
                    </label>
                    <select
                      value={deliveryForm.staffId}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          staffId: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-4 mt-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={deliveryForm.paid}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
                            ...prev,
                            paid: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Paid</span>
                    </label>
                    <select
                      value={deliveryForm.paymentMethod}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value as PaymentMethod,
                        }))
                      }
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CREDIT">Credit</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHECK">Check</option>
                      <option value="DIGITAL">Digital</option>
                    </select>
                  </div>
                </div>

                {/* Hen Eggs */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    🐔 Hen Eggs Delivery
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      (Price: {deliveryForm.henEggPrice.toLocaleString()} MMK/dozen)
                    </span>
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Small
                      </label>
                      <input
                        type="number"
                        value={deliveryForm.henEggs.small}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
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
                        value={deliveryForm.henEggs.medium}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
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
                        value={deliveryForm.henEggs.large}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
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
                        value={deliveryForm.henEggs.extraLarge}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
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
                  </div>
                </div>

                {/* Duck Eggs */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    🦆 Duck Eggs Delivery
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      (Price: {deliveryForm.duckEggPrice.toLocaleString()} MMK/dozen)
                    </span>
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Small
                      </label>
                      <input
                        type="number"
                        value={deliveryForm.duckEggs.small}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
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
                        value={deliveryForm.duckEggs.medium}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
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
                        value={deliveryForm.duckEggs.large}
                        onChange={(e) =>
                          setDeliveryForm((prev) => ({
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
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hen Egg Price (per dozen, MMK)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={deliveryForm.henEggPrice}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          henEggPrice:
                            Math.round(parseFloat(e.target.value)) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duck Egg Price (per dozen, MMK)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={deliveryForm.duckEggPrice}
                      onChange={(e) =>
                        setDeliveryForm((prev) => ({
                          ...prev,
                          duckEggPrice:
                            Math.round(parseFloat(e.target.value)) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={deliveryForm.notes}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Delivery Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Hen Eggs:</span>
                      <div className="font-medium">
                        {calculateDeliveryTotals().totalHenEggs} eggs (
                        {calculateDeliveryTotals().henDozens} dozen)
                      </div>
                      <div className="text-green-600">
                        {calculateDeliveryTotals().henValue.toLocaleString()} MMK
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Duck Eggs:</span>
                      <div className="font-medium">
                        {calculateDeliveryTotals().totalDuckEggs} eggs (
                        {calculateDeliveryTotals().duckDozens} dozen)
                      </div>
                      <div className="text-green-600">
                        {calculateDeliveryTotals().duckValue.toLocaleString()} MMK
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Value:</span>
                      <div className="text-lg font-bold text-green-600">
                        {calculateDeliveryTotals().totalValue.toLocaleString()} MMK
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeDeliveryModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingDelivery ? 'Update Delivery' : 'Create Delivery'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingRoute ? 'Edit Route' : 'Add New Route'}
                </h3>
                <button
                  onClick={closeRouteModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleRouteSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Route Name *
                    </label>
                    <input
                      type="text"
                      value={routeForm.name}
                      onChange={(e) =>
                        setRouteForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Schedule *
                    </label>
                    <select
                      value={routeForm.schedule}
                      onChange={(e) =>
                        setRouteForm((prev) => ({
                          ...prev,
                          schedule: e.target
                            .value as CollectionRoute['schedule'],
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="DAILY">Daily</option>
                      <option value="ALTERNATE">Alternate</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={routeForm.description}
                    onChange={(e) =>
                      setRouteForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Time (minutes)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={routeForm.estimatedTime}
                      onChange={(e) =>
                        setRouteForm((prev) => ({
                          ...prev,
                          estimatedTime: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Distance (km)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={routeForm.distance}
                      onChange={(e) =>
                        setRouteForm((prev) => ({
                          ...prev,
                          distance: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Collector
                    </label>
                    <select
                      value={routeForm.staffId}
                      onChange={(e) =>
                        setRouteForm((prev) => ({
                          ...prev,
                          staffId: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {staff
                        .filter((s) => s.department === 'COLLECTION')
                        .map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2 mt-6">
                      <input
                        type="checkbox"
                        checked={routeForm.active}
                        onChange={(e) =>
                          setRouteForm((prev) => ({
                            ...prev,
                            active: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Farms
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2">
                    {farmers.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No farmers available.
                      </p>
                    )}
                    {farmers.map((farmer) => (
                      <label
                        key={farmer.id}
                        className="flex items-center space-x-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={routeForm.farmerIds.includes(farmer.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setRouteForm((prev) => ({
                              ...prev,
                              farmerIds: checked
                                ? [...prev.farmerIds, farmer.id]
                                : prev.farmerIds.filter(
                                    (id) => id !== farmer.id,
                                  ),
                            }));
                          }}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>
                          {farmer.businessName || farmer.contactPerson}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeRouteModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={routeSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {routeSaving
                      ? 'Saving...'
                      : editingRoute
                        ? 'Update Route'
                        : 'Create Route'}
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
