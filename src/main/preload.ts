// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  Vendor,
  Product,
  Customer,
  Transaction,
  Staff,
  PaymentRecord,
} from '../generated/prisma';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);
contextBridge.exposeInMainWorld('api', {
  testConnection: () => ipcRenderer.invoke('db:testConnection'),
  login: (data: any) => ipcRenderer.invoke('auth:login', data),
  logout: () => ipcRenderer.invoke('auth:logout'),
  check: () => ipcRenderer.invoke('auth:check'),
  getProducts: () => ipcRenderer.invoke('db:getProducts'),
  getProductDetail: (id: string) =>
    ipcRenderer.invoke('db:getProductDetail', id),
  getTodaySalesSummary: () => ipcRenderer.invoke('db:getTodaySalesSummary'),
  createProductData: (product: Product) =>
    ipcRenderer.invoke('db:createProductData', product),
  updateProductData: (product: Product) =>
    ipcRenderer.invoke('db:updateProductData', product),
  createVendorData: (vendor: Vendor) =>
    ipcRenderer.invoke('db:createVendorData', vendor),
  getVendors: () => ipcRenderer.invoke('db:getVendors'),
  getVendorDetail: (id: string) => ipcRenderer.invoke('db:getVendorDetail', id),
  updateVendor: (vendor: Vendor) =>
    ipcRenderer.invoke('db:updateVendor', vendor),
  incrementVendorCredit: (id: string, amount: number) =>
    ipcRenderer.invoke('db:incrementVendorCredit', { id, amount }),
  createCustomerData: (customer: Customer) =>
    ipcRenderer.invoke('db:createCustomerData', customer),
  getCustomers: () => ipcRenderer.invoke('db:getCustomers'),
  getCustomerDetail: (id: string) =>
    ipcRenderer.invoke('db:getCustomerDetail', id),
  getCustomerByType: (type: string) =>
    ipcRenderer.invoke('db:getCustomerByType', type),
  getCustomerTransactions: (id: string) =>
    ipcRenderer.invoke('db:getCustomerTransactions', id),
  updateCustomer: (customer: Customer) =>
    ipcRenderer.invoke('db:updateCustomer', customer),
  createTransactionData: (transaction: Transaction) =>
    ipcRenderer.invoke('db:createTransactionData', transaction),
  getTransactions: () => ipcRenderer.invoke('db:getTransactions'),
  updateTransaction: (transaction: Transaction) =>
    ipcRenderer.invoke('db:updateTransaction', transaction),
  createStaffData: (staff: Staff) =>
    ipcRenderer.invoke('db:createStaffData', staff),
  getStaffs: () => ipcRenderer.invoke('db:getStaffs'),
  updateStaff: (staff: Staff) => ipcRenderer.invoke('db:updateStaff', staff),
  createPaymentRecordData: (paymentRecord: PaymentRecord) =>
    ipcRenderer.invoke('db:createPaymentRecordData', paymentRecord),
  getPaymentRecords: () => ipcRenderer.invoke('db:getPaymentRecords'),
  getPaymentRecordsWithCustomerId: (id: string) =>
    ipcRenderer.invoke('db:getPaymentRecordsWithCustomerId', id),
  getPaymentRecordsWithVendorId: (id: string) =>
    ipcRenderer.invoke('db:getPaymentRecordsWithVendorId', id),
  updatePaymentRecord: (paymentRecord: PaymentRecord) =>
    ipcRenderer.invoke('db:updatePaymentRecord', paymentRecord),
  createPurchaseData: (purchase: any) =>
    ipcRenderer.invoke('db:createPurchaseData', purchase),
  getPurchases: () => ipcRenderer.invoke('db:getPurchases'),
  getPurchaseByVendor: (id: string) =>
    ipcRenderer.invoke('db:getPurchaseByVendor', id),
  getPurchaseDetail: (id: string) =>
    ipcRenderer.invoke('db:getPurchaseDetail', id),
  updatePurchase: (purchase: any) =>
    ipcRenderer.invoke('db:updatePurchase', purchase),
  getCollectionRoutes: () => ipcRenderer.invoke('db:getCollectionRoutes'),
  getMarketPrices: () => ipcRenderer.invoke('db:getMarketPrices'),
  updateMarketPrices: (data: any) =>
    ipcRenderer.invoke('db:updateMarketPrices', data),
  getEggCollections: (query: any) =>
    ipcRenderer.invoke('db:getEggCollections', query),
  createEggCollection: (data: any) =>
    ipcRenderer.invoke('db:createEggCollection', data),
  updateEggCollection: (data: any) =>
    ipcRenderer.invoke('db:updateEggCollection', data),
  markEggCollectionPaid: (data: { id: string; staffId: string }) =>
    ipcRenderer.invoke('db:markEggCollectionPaid', data),
  createCollectionRoute: (data: any) =>
    ipcRenderer.invoke('db:createCollectionRoute', data),
  updateCollectionRoute: (data: any) =>
    ipcRenderer.invoke('db:updateCollectionRoute', data),
  deleteCollectionRoute: (id: string) =>
    ipcRenderer.invoke('db:deleteCollectionRoute', id),
  getFinancialDashboardData: (data: { period: string; date: string }) =>
    ipcRenderer.invoke('db:getFinancialDashboardData', data),
  getEggInventory: () => ipcRenderer.invoke('db:getEggInventory'),
  adjustEggInventory: (data: any) =>
    ipcRenderer.invoke('db:adjustEggInventory', data),
  getEggDeliveries: (query?: any) =>
    ipcRenderer.invoke('db:getEggDeliveries', query),
  createEggDelivery: (data: any) =>
    ipcRenderer.invoke('db:createEggDelivery', data),
  updateEggDelivery: (data: any) =>
    ipcRenderer.invoke('db:updateEggDelivery', data),
  deleteEggDelivery: (id: string) =>
    ipcRenderer.invoke('db:deleteEggDelivery', id),
});

export type ElectronHandler = typeof electronHandler;
