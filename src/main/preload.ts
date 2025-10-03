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
  getTodaySalesSummary: () => ipcRenderer.invoke('db:getTodaySalesSummary'),
  createProductData: (product: Product) =>
    ipcRenderer.invoke('db:createProductData', product),
  updateProductData: (product: Product) =>
    ipcRenderer.invoke('db:updateProductData', product),
  createVendorData: (vendor: Vendor) =>
    ipcRenderer.invoke('db:createVendorData', vendor),
  getVendors: () => ipcRenderer.invoke('db:getVendors'),
  updateVendor: (vendor: Vendor) =>
    ipcRenderer.invoke('db:updateVendor', vendor),
  createCustomerData: (customer: Customer) =>
    ipcRenderer.invoke('db:createCustomerData', customer),
  getCustomers: () => ipcRenderer.invoke('db:getCustomers'),
  getCustomerDetail: (id: string) =>
    ipcRenderer.invoke('db:getCustomerDetail', id),
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
  updatePaymentRecord: (paymentRecord: PaymentRecord) =>
    ipcRenderer.invoke('db:updatePaymentRecord', paymentRecord),
});

export type ElectronHandler = typeof electronHandler;
