import React, { useState, useEffect } from 'react';
import {
  HomeIcon,
  ShoppingCartIcon,
  CubeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CogIcon,
  BarsArrowUpIcon,
  WifiIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  UsersIcon,
  TruckIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import './App.css';

// Import components
import EnhancedPOSInterface from './components/POS/EnhancedPOSInterface';
import ProductManagement from './components/Inventory/ProductManagement';
import TransactionHistory from './components/Reports/TransactionHistory';
import CustomerManagement from './components/Customers/CustomerManagement';
import SettingsManagement from './components/Settings/SettingsManagement';
import StaffManagement from './components/Staff/StaffManagement';
import VendorManagement from './components/Vendors/VendorManagement';
import EggCollectionComponent from './components/EggCollection/EggCollection';
import FinancialDashboard from './components/Financial/FinancialDashboard';
import LoginPage from './components/Login/LoginPage';
import CustomerDetail from './components/Customers/CustomerDetail';

type TabType =
  | 'pos'
  | 'inventory'
  | 'reports'
  | 'customers'
  | 'customerDetail'
  | 'vendors'
  | 'staff'
  | 'eggs'
  | 'financial'
  | 'settings';

interface AppState {
  activeTab: TabType;
  isOnline: boolean;
  isSyncing: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>;
  currentUser: {
    id: string;
    name: string;
    role: string;
    permissions: string[];
  };
  selectedCustomerId?: string; // 👈 add this
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    activeTab: 'pos',
    isOnline: navigator.onLine,
    isSyncing: false,
    notifications: [],
    currentUser: {
      id: '1',
      name: 'Admin User',
      role: 'Manager',
      permissions: ['all'],
    },
  });
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesSummary, setSalesSummary] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      const u: any = await window.api.check();
      setUser(u);
      setLoading(false);
      if (u) {
        setAppState((prev) => ({
          ...prev,
          currentUser: {
            id: u.id,
            name: u.username,
            role: u.position,
            permissions: ['all'],
          },
        }));
      }
    };
    checkSession();
    console.log(user);
  }, []);
  const fetchSalesSummary = async () => {
    try {
      const summary = await window.api.getTodaySalesSummary();
      setSalesSummary(summary);
    } catch (error) {
      console.error('Failed to fetch sales summary', error);
    }
  };
  useEffect(() => {
    console.log('Fetching sales summary...');
    fetchSalesSummary();
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setAppState((prev) => ({ ...prev, isOnline: true }));
      addNotification('success', 'Connection restored - syncing data...');

      // Trigger sync when coming back online
      setTimeout(() => {
        setAppState((prev) => ({ ...prev, isSyncing: true }));
        // Simulate sync process
        setTimeout(() => {
          setAppState((prev) => ({ ...prev, isSyncing: false }));
          addNotification('success', 'Data synchronized successfully');
        }, 3000);
      }, 1000);
    };

    const handleOffline = () => {
      setAppState((prev) => ({ ...prev, isOnline: false }));
      addNotification(
        'warning',
        'Working offline - changes will sync when connection is restored',
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add notification helper
  const addNotification = (
    type: 'success' | 'warning' | 'error' | 'info',
    message: string,
  ) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };

    setAppState((prev) => ({
      ...prev,
      notifications: [...prev.notifications, notification],
    }));

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  // Simulate periodic sync check
  useEffect(() => {
    const interval = setInterval(() => {
      if (appState.isOnline && !appState.isSyncing) {
        // Random chance to show sync activity (for demo)
        if (Math.random() < 0.05) {
          // 5% chance every 10 seconds
          setAppState((prev) => ({ ...prev, isSyncing: true }));
          setTimeout(() => {
            setAppState((prev) => ({ ...prev, isSyncing: false }));
          }, 2000);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [appState.isOnline, appState.isSyncing]);

  const tabs = [
    {
      id: 'pos',
      name: 'POS',
      icon: ShoppingCartIcon,
      shortcut: 'F1',
      color: 'text-blue-600',
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: CubeIcon,
      shortcut: 'F2',
      color: 'text-green-600',
    },
    {
      id: 'customers',
      name: 'Customers',
      icon: UserGroupIcon,
      shortcut: 'F3',
      color: 'text-purple-600',
    },
    {
      id: 'vendors',
      name: 'Vendors',
      icon: BuildingOfficeIcon,
      shortcut: 'F4',
      color: 'text-orange-600',
    },
    {
      id: 'eggs',
      name: 'Egg Collection',
      icon: TruckIcon,
      shortcut: 'F5',
      color: 'text-yellow-600',
    },
    {
      id: 'financial',
      name: 'Financial',
      icon: ChartBarIcon,
      shortcut: 'F6',
      color: 'text-indigo-600',
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: DocumentTextIcon,
      shortcut: 'F7',
      color: 'text-gray-600',
    },
    {
      id: 'staff',
      name: 'Staff',
      icon: UsersIcon,
      shortcut: 'F8',
      color: 'text-pink-600',
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: CogIcon,
      shortcut: 'F9',
      color: 'text-gray-600',
    },
  ];

  const renderActiveComponent = () => {
    switch (appState.activeTab) {
      case 'pos':
        return <EnhancedPOSInterface onDataChanged={fetchSalesSummary} />;
      case 'inventory':
        return <ProductManagement />;
      case 'customers':
        return (
          <CustomerManagement
            onViewCustomer={(id) =>
              setAppState((prev) => ({
                ...prev,
                activeTab: 'customerDetail',
                selectedCustomerId: id,
              }))
            }
          />
        );
      case 'customerDetail':
        return (
          <CustomerDetail
            customerId={appState.selectedCustomerId!}
            onBack={() =>
              setAppState((prev) => ({ ...prev, activeTab: 'customers' }))
            }
          />
        );
      case 'vendors':
        return <VendorManagement />;
      case 'eggs':
        return <EggCollectionComponent />;
      case 'financial':
        return <FinancialDashboard />;
      case 'reports':
        return <TransactionHistory />;
      case 'staff':
        return <StaffManagement />;
      case 'settings':
        return <SettingsManagement />;
      default:
        return <EnhancedPOSInterface onDataChanged={fetchSalesSummary} />;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey) return; // Ignore Alt/Ctrl combinations

      const tabMap: Record<string, TabType> = {
        F1: 'pos',
        F2: 'inventory',
        F3: 'customers',
        F4: 'vendors',
        F5: 'eggs',
        F6: 'financial',
        F7: 'reports',
        F8: 'staff',
        F9: 'settings',
      };

      if (tabMap[event.key]) {
        event.preventDefault();
        setAppState((prev) => ({ ...prev, activeTab: tabMap[event.key] }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const getTabDisplayName = (tabId: string): string => {
    const tabNames: Record<string, string> = {
      pos: 'Point of Sale',
      inventory: 'Inventory Management',
      customers: 'Customer Management',
      customerDetail: 'Customer Detail',
      vendors: 'Vendor Management',
      eggs: 'Egg Collection',
      financial: 'Financial Dashboard',
      reports: 'Transaction Reports',
      staff: 'Staff Management',
      settings: 'System Settings',
    };
    return tabNames[tabId] || tabId;
  };

  // Mock daily stats
  const dailyStats = {
    sales: 1247.5,
    transactions: 23,
    itemsSold: 156,
    eggsCollected: 480,
    creditOutstanding: 15650,
    vendorPaymentsDue: 8500,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-600 animate-pulse">Checking session...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  if (!salesSummary) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-gray-600 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              🚜
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">AgriPOS</h1>
              <p className="text-sm text-gray-600">Farm Supply & Eggs</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <WifiIcon
                className={`w-5 h-5 mr-2 ${appState.isOnline ? 'text-green-600' : 'text-red-600'}`}
              />
              <span
                className={`text-sm font-medium ${appState.isOnline ? 'text-green-600' : 'text-red-600'}`}
              >
                {appState.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {appState.isSyncing && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-xs text-gray-600">Syncing...</span>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {appState.currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                {appState.currentUser.name}
              </div>
              <div className="text-xs text-gray-600">
                {appState.currentUser.role}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setAppState((prev) => ({
                    ...prev,
                    activeTab: tab.id as TabType,
                  }))
                }
                className={`w-full flex items-center px-3 py-3 text-left rounded-lg mb-1 transition-colors ${
                  appState.activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon
                  className={`w-5 h-5 mr-3 ${appState.activeTab === tab.id ? 'text-blue-700' : tab.color}`}
                />
                <span className="font-medium flex-1">{tab.name}</span>
                <span className="text-xs text-gray-400">{tab.shortcut}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Quick Stats */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-900">
              {salesSummary.totalSales.toLocaleString()} MMK
            </div>
            <div className="text-sm text-gray-600">Today's Sales</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {salesSummary.totalTransactions}
              </div>
              <div className="text-gray-600">Transactions</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {salesSummary.totalItemsSold}
              </div>
              <div className="text-gray-600">Items Sold</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-600">
                {dailyStats.eggsCollected}
              </div>
              <div className="text-gray-600">Eggs Today</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">
                ${(dailyStats.creditOutstanding / 1000).toFixed(1)}k
              </div>
              <div className="text-gray-600">Credit Out</div>
            </div>
          </div>

          {/* Quick Action Alerts */}
          {dailyStats.vendorPaymentsDue > 0 && (
            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
              <div className="flex items-center">
                <CurrencyDollarIcon className="w-4 h-4 text-yellow-600 mr-2" />
                <div className="text-xs">
                  <div className="font-medium text-yellow-800">
                    Payments Due
                  </div>
                  <div className="text-yellow-700">
                    ${dailyStats.vendorPaymentsDue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                {getTabDisplayName(appState.activeTab)}
              </h2>
              {appState.activeTab === 'pos' && (
                <div className="ml-4 flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  System Ready
                </div>
              )}
              {appState.activeTab === 'eggs' && (
                <div className="ml-4 flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Collection Mode
                </div>
              )}
              {appState.activeTab === 'financial' && (
                <div className="ml-4 flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Live Analytics
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications Badge */}
              {appState.notifications.length > 0 && (
                <div className="relative">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <BarsArrowUpIcon className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {appState.notifications.length}
                    </span>
                  </button>
                </div>
              )}

              {/* Current Date & Time */}
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              {/* Current Time */}
              <div className="text-sm font-mono text-gray-600">
                {new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">{renderActiveComponent()}</main>
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {appState.notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-md p-4 rounded-lg shadow-lg transition-all transform ${
              notification.type === 'success'
                ? 'bg-green-100 border border-green-200'
                : notification.type === 'warning'
                  ? 'bg-yellow-100 border border-yellow-200'
                  : notification.type === 'error'
                    ? 'bg-red-100 border border-red-200'
                    : 'bg-blue-100 border border-blue-200'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <div className="w-5 h-5 text-green-600">✓</div>
                )}
                {notification.type === 'warning' && (
                  <div className="w-5 h-5 text-yellow-600">⚠</div>
                )}
                {notification.type === 'error' && (
                  <div className="w-5 h-5 text-red-600">✕</div>
                )}
                {notification.type === 'info' && (
                  <div className="w-5 h-5 text-blue-600">ⓘ</div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm font-medium ${
                    notification.type === 'success'
                      ? 'text-green-800'
                      : notification.type === 'warning'
                        ? 'text-yellow-800'
                        : notification.type === 'error'
                          ? 'text-red-800'
                          : 'text-blue-800'
                  }`}
                >
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-3 flex-shrink-0"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Keyboard Shortcuts Help (can be toggled) */}
      <div className="hidden fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg">
        <div className="text-sm">
          <div className="font-medium mb-2">Keyboard Shortcuts</div>
          <div className="space-y-1">
            {tabs.slice(0, 6).map((tab) => (
              <div key={tab.id} className="flex justify-between">
                <span>{tab.name}</span>
                <span className="text-gray-400">{tab.shortcut}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
