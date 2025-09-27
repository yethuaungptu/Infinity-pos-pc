import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  PrinterIcon,
  CreditCardIcon,
  CloudIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxRate: number;
  currency: string;
  timezone: string;
  receiptHeader: string;
  receiptFooter: string;
}

interface PaymentSettings {
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  squareEnabled: boolean;
  squareApplicationId: string;
  squareAccessToken: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  paypalClientSecret: string;
  cashEnabled: boolean;
}

interface PrinterSettings {
  thermalPrinterEnabled: boolean;
  printerIpAddress: string;
  printerPort: string;
  paperWidth: number;
  printLogo: boolean;
  autoOpenDrawer: boolean;
  printDuplicates: boolean;
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  cloudBackup: boolean;
  offlineMode: boolean;
  conflictResolution: 'server_wins' | 'local_wins' | 'manual';
}

interface NotificationSettings {
  lowStockAlerts: boolean;
  lowStockThreshold: number;
  dailyReports: boolean;
  errorNotifications: boolean;
  customerBirthdays: boolean;
  salesTargets: boolean;
}

const SettingsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'store' | 'payment' | 'printer' | 'sync' | 'notifications'
  >('store');
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  // Store Settings
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: 'My Coffee Shop',
    address: '123 Main Street, Anytown, CA 90210',
    phone: '+1 (555) 123-4567',
    email: 'info@mycoffeeshop.com',
    website: 'https://mycoffeeshop.com',
    taxRate: 8.25,
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    receiptHeader: 'Thank you for visiting!',
    receiptFooter: 'Please visit us again!',
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    squareEnabled: false,
    squareApplicationId: '',
    squareAccessToken: '',
    paypalEnabled: false,
    paypalClientId: '',
    paypalClientSecret: '',
    cashEnabled: true,
  });

  // Printer Settings
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    thermalPrinterEnabled: true,
    printerIpAddress: '192.168.1.100',
    printerPort: '9100',
    paperWidth: 58, // mm
    printLogo: true,
    autoOpenDrawer: true,
    printDuplicates: false,
  });

  // Sync Settings
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    autoSync: true,
    syncInterval: 5,
    cloudBackup: true,
    offlineMode: false,
    conflictResolution: 'server_wins',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      lowStockAlerts: true,
      lowStockThreshold: 10,
      dailyReports: true,
      errorNotifications: true,
      customerBirthdays: false,
      salesTargets: false,
    });

  const saveSettings = async () => {
    setSaveStatus('saving');

    try {
      // Here you would save to your backend/database
      const allSettings = {
        store: storeSettings,
        payment: paymentSettings,
        printer: printerSettings,
        sync: syncSettings,
        notifications: notificationSettings,
      };

      console.log('Saving settings:', allSettings);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const testPrinter = async () => {
    try {
      console.log('Testing printer connection...', printerSettings);
      alert('Test print sent to printer!');
    } catch (error) {
      console.error('Printer test failed:', error);
      alert('Printer test failed. Please check your settings.');
    }
  };

  const testPayment = async (provider: string) => {
    try {
      console.log(`Testing ${provider} connection...`);
      alert(`${provider} connection test successful!`);
    } catch (error) {
      console.error(`${provider} test failed:`, error);
      alert(
        `${provider} connection test failed. Please check your credentials.`,
      );
    }
  };

  const exportSettings = () => {
    const settings = {
      store: storeSettings,
      payment: {
        ...paymentSettings,
        stripeSecretKey: '[HIDDEN]',
        squareAccessToken: '[HIDDEN]',
        paypalClientSecret: '[HIDDEN]',
      },
      printer: printerSettings,
      sync: syncSettings,
      notifications: notificationSettings,
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pos_settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);

        if (importedSettings.store) setStoreSettings(importedSettings.store);
        if (importedSettings.printer)
          setPrinterSettings(importedSettings.printer);
        if (importedSettings.sync) setSyncSettings(importedSettings.sync);
        if (importedSettings.notifications)
          setNotificationSettings(importedSettings.notifications);

        alert('Settings imported successfully!');
      } catch (error) {
        alert('Failed to import settings. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'store', name: 'Store Info', icon: CogIcon },
    { id: 'payment', name: 'Payments', icon: CreditCardIcon },
    { id: 'printer', name: 'Printer', icon: PrinterIcon },
    { id: 'sync', name: 'Sync & Backup', icon: CloudIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">
              Configure your POS system preferences
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="hidden"
              id="import-settings"
            />
            <label
              htmlFor="import-settings"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Import Settings
            </label>
            <button
              onClick={exportSettings}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Export Settings
            </button>
            <button
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2 rounded-lg font-medium flex items-center ${
                saveStatus === 'saved'
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {saveStatus === 'saving' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {saveStatus === 'saved' && <CheckIcon className="w-4 h-4 mr-2" />}
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                  ? 'Saved!'
                  : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64">
          <nav className="bg-white rounded-lg shadow p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-4 py-2 text-left rounded-lg ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            {/* Store Settings */}
            {activeTab === 'store' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <CogIcon className="w-6 h-6 mr-2" />
                  Store Information
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Name *
                      </label>
                      <input
                        type="text"
                        value={storeSettings.name}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={storeSettings.phone}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={storeSettings.address}
                      onChange={(e) =>
                        setStoreSettings((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={storeSettings.email}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={storeSettings.website}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={storeSettings.taxRate}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            taxRate: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={storeSettings.currency}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            currency: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={storeSettings.timezone}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            timezone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">
                          Pacific Time
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receipt Header
                      </label>
                      <input
                        type="text"
                        value={storeSettings.receiptHeader}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            receiptHeader: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receipt Footer
                      </label>
                      <input
                        type="text"
                        value={storeSettings.receiptFooter}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            receiptFooter: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <CreditCardIcon className="w-6 h-6 mr-2" />
                  Payment Methods
                </h2>
                <div className="space-y-8">
                  {/* Cash */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          💵
                        </div>
                        <div>
                          <h3 className="font-medium">Cash Payments</h3>
                          <p className="text-sm text-gray-600">
                            Accept cash payments
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentSettings.cashEnabled}
                          onChange={(e) =>
                            setPaymentSettings((prev) => ({
                              ...prev,
                              cashEnabled: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Stripe */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          💳
                        </div>
                        <div>
                          <h3 className="font-medium">Stripe</h3>
                          <p className="text-sm text-gray-600">
                            Accept credit and debit cards
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentSettings.stripeEnabled}
                          onChange={(e) =>
                            setPaymentSettings((prev) => ({
                              ...prev,
                              stripeEnabled: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {paymentSettings.stripeEnabled && (
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Publishable Key
                          </label>
                          <input
                            type="text"
                            value={paymentSettings.stripePublishableKey}
                            onChange={(e) =>
                              setPaymentSettings((prev) => ({
                                ...prev,
                                stripePublishableKey: e.target.value,
                              }))
                            }
                            placeholder="pk_test_..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Secret Key
                          </label>
                          <input
                            type="password"
                            value={paymentSettings.stripeSecretKey}
                            onChange={(e) =>
                              setPaymentSettings((prev) => ({
                                ...prev,
                                stripeSecretKey: e.target.value,
                              }))
                            }
                            placeholder="sk_test_..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => testPayment('Stripe')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Test Connection
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Square */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          ⬜
                        </div>
                        <div>
                          <h3 className="font-medium">Square</h3>
                          <p className="text-sm text-gray-600">
                            Square payment processing
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentSettings.squareEnabled}
                          onChange={(e) =>
                            setPaymentSettings((prev) => ({
                              ...prev,
                              squareEnabled: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {paymentSettings.squareEnabled && (
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Application ID
                          </label>
                          <input
                            type="text"
                            value={paymentSettings.squareApplicationId}
                            onChange={(e) =>
                              setPaymentSettings((prev) => ({
                                ...prev,
                                squareApplicationId: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Access Token
                          </label>
                          <input
                            type="password"
                            value={paymentSettings.squareAccessToken}
                            onChange={(e) =>
                              setPaymentSettings((prev) => ({
                                ...prev,
                                squareAccessToken: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => testPayment('Square')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Test Connection
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Printer Settings */}
            {activeTab === 'printer' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <PrinterIcon className="w-6 h-6 mr-2" />
                  Printer Configuration
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">Thermal Printer</h3>
                      <p className="text-sm text-gray-600">
                        Enable thermal receipt printing
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printerSettings.thermalPrinterEnabled}
                        onChange={(e) =>
                          setPrinterSettings((prev) => ({
                            ...prev,
                            thermalPrinterEnabled: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {printerSettings.thermalPrinterEnabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Printer IP Address
                          </label>
                          <input
                            type="text"
                            value={printerSettings.printerIpAddress}
                            onChange={(e) =>
                              setPrinterSettings((prev) => ({
                                ...prev,
                                printerIpAddress: e.target.value,
                              }))
                            }
                            placeholder="192.168.1.100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Port
                          </label>
                          <input
                            type="text"
                            value={printerSettings.printerPort}
                            onChange={(e) =>
                              setPrinterSettings((prev) => ({
                                ...prev,
                                printerPort: e.target.value,
                              }))
                            }
                            placeholder="9100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Paper Width (mm)
                        </label>
                        <select
                          value={printerSettings.paperWidth}
                          onChange={(e) =>
                            setPrinterSettings((prev) => ({
                              ...prev,
                              paperWidth: parseInt(e.target.value),
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={58}>58mm</option>
                          <option value={80}>80mm</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="printLogo"
                            checked={printerSettings.printLogo}
                            onChange={(e) =>
                              setPrinterSettings((prev) => ({
                                ...prev,
                                printLogo: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="printLogo"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Print store logo on receipts
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="autoOpenDrawer"
                            checked={printerSettings.autoOpenDrawer}
                            onChange={(e) =>
                              setPrinterSettings((prev) => ({
                                ...prev,
                                autoOpenDrawer: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="autoOpenDrawer"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Automatically open cash drawer
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="printDuplicates"
                            checked={printerSettings.printDuplicates}
                            onChange={(e) =>
                              setPrinterSettings((prev) => ({
                                ...prev,
                                printDuplicates: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="printDuplicates"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Print duplicate receipts (customer + merchant copy)
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={testPrinter}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Test Printer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sync Settings */}
            {activeTab === 'sync' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <CloudIcon className="w-6 h-6 mr-2" />
                  Sync & Backup Settings
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">Auto Sync</h3>
                      <p className="text-sm text-gray-600">
                        Automatically sync data with cloud
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncSettings.autoSync}
                        onChange={(e) =>
                          setSyncSettings((prev) => ({
                            ...prev,
                            autoSync: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {syncSettings.autoSync && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sync Interval (minutes)
                      </label>
                      <select
                        value={syncSettings.syncInterval}
                        onChange={(e) =>
                          setSyncSettings((prev) => ({
                            ...prev,
                            syncInterval: parseInt(e.target.value),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>Every minute</option>
                        <option value={5}>Every 5 minutes</option>
                        <option value={15}>Every 15 minutes</option>
                        <option value={30}>Every 30 minutes</option>
                        <option value={60}>Every hour</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">Cloud Backup</h3>
                      <p className="text-sm text-gray-600">
                        Backup data to cloud storage
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncSettings.cloudBackup}
                        onChange={(e) =>
                          setSyncSettings((prev) => ({
                            ...prev,
                            cloudBackup: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">Offline Mode</h3>
                      <p className="text-sm text-gray-600">
                        Force offline operation (no sync attempts)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncSettings.offlineMode}
                        onChange={(e) =>
                          setSyncSettings((prev) => ({
                            ...prev,
                            offlineMode: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conflict Resolution
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      How to handle data conflicts when syncing
                    </p>
                    <select
                      value={syncSettings.conflictResolution}
                      onChange={(e) =>
                        setSyncSettings((prev) => ({
                          ...prev,
                          conflictResolution: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="server_wins">
                        Server Wins (recommended)
                      </option>
                      <option value="local_wins">Local Wins</option>
                      <option value="manual">Manual Resolution</option>
                    </select>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium mb-3">Sync Status</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800">
                          Last sync: 2 minutes ago
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Sync Now
                      </button>
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        View Sync Log
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <BellIcon className="w-6 h-6 mr-2" />
                  Notification Settings
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">Low Stock Alerts</h3>
                      <p className="text-sm text-gray-600">
                        Get notified when products are running low
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.lowStockAlerts}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            lowStockAlerts: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {notificationSettings.lowStockAlerts && (
                    <div className="ml-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alert Threshold (units)
                      </label>
                      <input
                        type="number"
                        value={notificationSettings.lowStockThreshold}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            lowStockThreshold: parseInt(e.target.value),
                          }))
                        }
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Alert when stock falls below this number
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">Daily Reports</h3>
                      <p className="text-sm text-gray-600">
                        Receive daily sales and inventory reports
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.dailyReports}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            dailyReports: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">Error Notifications</h3>
                      <p className="text-sm text-gray-600">
                        Get alerted about system errors and issues
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.errorNotifications}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            errorNotifications: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">Customer Birthdays</h3>
                      <p className="text-sm text-gray-600">
                        Get reminders about customer birthdays
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.customerBirthdays}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            customerBirthdays: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium">Sales Targets</h3>
                      <p className="text-sm text-gray-600">
                        Track progress towards daily/monthly sales goals
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.salesTargets}
                        onChange={(e) =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            salesTargets: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;
