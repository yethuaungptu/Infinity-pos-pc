/* eslint global-require: off, no-console: off, promise/always-return: off */

import 'dotenv/config';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

// ✅ Import our database service
import { databaseService } from './database';
import { InventoryService } from './services/inventoryService';
import { VendorService } from './services/vendorService';
import { CustomerService } from './services/customerService';
import { TransactionService } from './services/transactionService';
import { StaffService } from './services/staffService';
import { AuthService } from './services/authService';
import { IndexService } from './services/indexService';
import { PaymentRecordService } from './services/paymentService';
import { PurchaseService } from './services/purchaseService';
import { EggCollectionService } from './services/eggCollectionService';
import { FinancialService } from './services/financialService';
import { EggInventoryService } from './services/eggInventoryService.js';
import { SyncService } from './services/syncService.js';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

// ---------------------------
// Existing IPC test
// ---------------------------
ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// ---------------------------
// New IPC handlers (Database)
// ---------------------------
ipcMain.handle('db:testConnection', async () => {
  return databaseService.testConnection();
});

ipcMain.handle('auth:login', async (event, data) => {
  return AuthService.login(data);
});
ipcMain.handle('auth:logout', async () => {
  return AuthService.logout();
});
ipcMain.handle('auth:check', async () => {
  return AuthService.checkAuth();
});

ipcMain.handle('db:getTodaySalesSummary', async () => {
  return IndexService.getTodaySalesSummary();
});

ipcMain.handle('db:getProducts', async () => {
  return InventoryService.getAllProduct();
});

ipcMain.handle('db:getProductDetail', async (event, id) => {
  return InventoryService.getProductDetail(id);
});

ipcMain.handle('db:createProductData', async (event, data) => {
  return InventoryService.createProduct(data);
});

ipcMain.handle('db:updateProductData', async (event, data) => {
  return InventoryService.updateProduct(data);
});

ipcMain.handle('db:createVendorData', async (event, data) => {
  return VendorService.createVendor(data);
});
ipcMain.handle('db:getVendors', async () => {
  return VendorService.getVendors();
});
ipcMain.handle('db:getVendorDetail', async (event, id) => {
  return VendorService.getVendorDetail(id);
});
ipcMain.handle('db:incrementVendorCredit', async (event, data) => {
  return VendorService.incrementVendorCredit(data.id, data.amount);
});
ipcMain.handle('db:updateVendor', async (event, data) => {
  return VendorService.updateVendor(data);
});

ipcMain.handle('db:createCustomerData', async (event, data) => {
  return CustomerService.createCustomer(data);
});
ipcMain.handle('db:getCustomers', async () => {
  return CustomerService.getCustomers();
});
ipcMain.handle('db:getCustomerByType', async (event, type) => {
  return CustomerService.getCustomerByType(type);
});
ipcMain.handle('db:getCustomerDetail', async (event, id) => {
  return CustomerService.getCustomerById(id);
});
ipcMain.handle('db:getCustomerTransactions', async (event, id) => {
  return CustomerService.getCustomerTransactions(id);
});
ipcMain.handle('db:updateCustomer', async (event, data) => {
  return CustomerService.updateCustomer(data);
});

ipcMain.handle('db:createTransactionData', async (event, data) => {
  return TransactionService.createTransaction(data);
});
ipcMain.handle('db:getTransactions', async () => {
  return TransactionService.getTransactions();
});
ipcMain.handle('db:updateTransaction', async (event, data) => {
  return TransactionService.updateTransaction(data);
});

ipcMain.handle('db:createStaffData', async (event, data) => {
  return StaffService.createStaff(data);
});
ipcMain.handle('db:getStaffs', async () => {
  return StaffService.getStaffs();
});
ipcMain.handle('db:updateStaff', async (event, data) => {
  return StaffService.updateStaff(data);
});

ipcMain.handle('db:createPaymentRecordData', async (event, data) => {
  return PaymentRecordService.createPaymentRecord(data);
});
ipcMain.handle('db:getPaymentRecords', async () => {
  return PaymentRecordService.getPaymentRecords();
});
ipcMain.handle('db:getPaymentRecordsWithCustomerId', async (event, data) => {
  return PaymentRecordService.getPaymentRecordsWithCustomerId(data);
});
ipcMain.handle('db:getPaymentRecordsWithVendorId', async (event, data) => {
  return PaymentRecordService.getPaymentRecordsWithVendorId(data);
});
ipcMain.handle('db:updatePaymentRecord', async (event, data) => {
  return PaymentRecordService.updatePaymentRecord(data);
});

ipcMain.handle('db:createPurchaseData', async (event, data) => {
  return PurchaseService.createPurchase(data);
});
ipcMain.handle('db:getPurchases', async () => {
  return PurchaseService.getPurchases();
});
ipcMain.handle('db:getPurchaseByVendor', async (event, data) => {
  return PurchaseService.getPurchaseByVendor(data);
});
ipcMain.handle('db:getPurchaseDetail', async (event, id) => {
  return PurchaseService.getPurchaseDetail(id);
});
ipcMain.handle('db:updatePurchase', async (event, data) => {
  return PurchaseService.updatePurchase(data);
});

ipcMain.handle('db:getCollectionRoutes', async () => {
  return EggCollectionService.getCollectionRoutes();
});

ipcMain.handle('db:getMarketPrices', async () => {
  return EggCollectionService.getMarketPrices();
});

ipcMain.handle('db:updateMarketPrices', async (event, data) => {
  return EggCollectionService.updateMarketPrices(data);
});

ipcMain.handle('db:getEggCollections', async (event, data) => {
  return EggCollectionService.getEggCollections(data);
});

ipcMain.handle('db:createEggCollection', async (event, data) => {
  return EggCollectionService.createEggCollection(data);
});

ipcMain.handle('db:updateEggCollection', async (event, data) => {
  return EggCollectionService.updateEggCollection(data);
});

ipcMain.handle('db:markEggCollectionPaid', async (event, data) => {
  return EggCollectionService.markCollectionPaid(data.id, data.staffId);
});

ipcMain.handle('db:createCollectionRoute', async (event, data) => {
  return EggCollectionService.createCollectionRoute(data);
});

ipcMain.handle('db:updateCollectionRoute', async (event, data) => {
  return EggCollectionService.updateCollectionRoute(data);
});

ipcMain.handle('db:deleteCollectionRoute', async (event, id) => {
  return EggCollectionService.deleteCollectionRoute(id);
});

ipcMain.handle('db:getFinancialDashboardData', async (event, data) => {
  return FinancialService.getFinancialDashboardData(data.period, data.date);
});

ipcMain.handle('db:syncNow', async () => {
  await SyncService.syncNow();
  return { ok: true };
});
ipcMain.handle('db:getSyncLogs', async (event, limit?: number) => {
  return SyncService.getSyncLogs(limit);
});

ipcMain.handle('db:clearSyncLogs', async () => {
  await SyncService.clearSyncLogs();
  return { ok: true };
});
ipcMain.handle('db:getEggInventory', async () => {
  return EggInventoryService.getEggInventory();
});

ipcMain.handle('db:adjustEggInventory', async (event, data) => {
  return EggInventoryService.adjustEggInventory(data);
});

ipcMain.handle('db:getEggDeliveries', async (event, data) => {
  return EggInventoryService.getEggDeliveries(data);
});

ipcMain.handle('db:createEggDelivery', async (event, data) => {
  return EggInventoryService.createEggDelivery(data);
});

ipcMain.handle('db:updateEggDelivery', async (event, data) => {
  return EggInventoryService.updateEggDelivery(data);
});

ipcMain.handle('db:deleteEggDelivery', async (event, id) => {
  return EggInventoryService.deleteEggDelivery(id);
});

// ---------------------------
// Error handling & Debugging
// ---------------------------
if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

// ---------------------------
// Create Main Window
// ---------------------------
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.cjs')
        : path.join(__dirname, '../../.erb/dll/preload.cjs'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open external links in user’s default browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Auto updater
  // eslint-disable-next-line
  new AppUpdater();
};

// ---------------------------
// App lifecycle
// ---------------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    SyncService.start(Number(process.env.SYNC_INTERVAL_MINUTES) || 5);
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
