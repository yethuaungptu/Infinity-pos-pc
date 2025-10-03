// Core business types for Agricultural POS System

export type CustomerType = 'FARMER' | 'REGULAR' | 'WHOLESALE';
export type ProductType =
  | 'FEED'
  | 'MEDICINE'
  | 'EQUIPMENT'
  | 'EGGS'
  | 'SUPPLIES'
  | 'OTHERS';
export type PaymentMethod =
  | 'CASH'
  | 'CREDIT'
  | 'BANK_TRANSFER'
  | 'CHECK'
  | 'DIGITAL';
export type TransactionStatus =
  | 'COMPLETED'
  | 'PENDING'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIAL_REFUND';
export type CreditStatus =
  | 'CURRENT'
  | 'OVERDUE_30'
  | 'OVERDUE_60'
  | 'OVERDUE_90'
  | 'BAD_DEBT';

// Customer interfaces
export interface Customer {
  id: string;
  type: CustomerType;
  businessName?: string;
  contactPerson: string;
  email?: string;
  phone?: string;
  address?: string;

  // Credit information
  creditLimit: number;
  creditBalance: number; // Current outstanding amount
  paymentTerms: number; // Days (7, 30, 60, 90)
  creditStatus: CreditStatus;

  // Farmer-specific
  farmSize?: number; // in acres
  animalTypes?: string[]; // ['poultry', 'cattle', 'dairy']
  henEggsDailyProduction?: number;
  duckEggsDailyProduction?: number;
  collectionSchedule?: 'DAILY' | 'ALTERNATE' | 'WEEKLY' | 'CUSTOM';

  // Regular customer specific
  isRetail?: boolean;
  loyaltyPoints?: number;

  // Business metrics
  totalPurchases: number;
  totalEggSales?: number; // for farmers
  lastPurchase?: Date;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

// Vendor/Supplier interfaces
export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  email?: string;
  phone?: string;
  address?: Address;

  // Credit terms from vendor
  creditLimit: number;
  creditBalance: number; // What we owe them
  paymentTerms: number; // Days they give us to pay
  earlyPaymentDiscount?: number; // Percentage discount for early payment

  // Product categories they supply
  productTypes: ProductType[];

  // Performance metrics
  totalPurchases: number;
  onTimePaymentRate: number; // Percentage
  lastOrder?: Date;
  lastPayment?: Date;

  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

// Product interface
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  type: ProductType;
  category: string;

  // Pricing
  costPrice: number; // What we pay vendor
  sellingPrice: number; // What we charge customer
  wholesalePrice?: number; // Bulk/farmer pricing

  // Inventory
  stock: number;
  unit: string; // 'kg', 'bags', 'pieces', 'dozens'
  minimumStock: number;

  // Product-specific attributes
  expiryDate?: Date;
  batchNumber?: string;
  manufacturer?: string;

  // Medicine-specific
  requiresPrescription?: boolean;
  activeIngredient?: string;
  dosage?: string;

  // Feed-specific
  animalType?: string; // 'poultry', 'cattle', 'dairy'
  nutritionInfo?: string;
  feedType?: string; // 'starter', 'grower', 'finisher'

  // Vendor information
  primaryVendorId: string;
  alternateVendors?: string[];
  primaryVendor?: any;

  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

// Transaction interfaces
export interface Transaction {
  id: string;
  receiptNumber: string;
  type:
    | 'SALE'
    | 'PURCHASE'
    | 'EGG_COLLECTION'
    | 'EGG_SALE'
    | 'REFUND'
    | 'ADJUSTMENT';

  // Customer/Vendor
  customerId?: string;
  vendorId?: string;

  // Items
  items: {
    create: TransactionItem[];
  };

  // Financial
  subtotal: number;
  tax: number;
  discount: number;
  total: number;

  // Payment
  paymentMethod: PaymentMethod;
  paidAmount: number;
  balanceAmount: number; // For credit transactions

  // Status
  status: TransactionStatus;

  // Staff and location
  staffId: string;
  locationId?: string; // For egg collection routes

  // Timestamps
  timestamp: Date;
  dueDate?: Date; // For credit transactions

  // Additional info
  notes?: string;
  synced: boolean;
}

export interface TransactionItem {
  id: string;
  product: any;
  productName: string;
  productSku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;

  // Special attributes
  batchNumber?: string;
  expiryDate?: Date;
  grade?: string; // For eggs: 'small', 'medium', 'large', 'xl'
}

// Egg Collection specific
export interface EggCollection {
  id: string;
  farmerId: string;
  collectionDate: Date;
  routeId?: string;
  staffId: string;

  // Hen eggs
  henEggs: {
    small: number;
    medium: number;
    large: number;
    extraLarge: number;
    damaged: number;
  };

  // Duck eggs
  duckEggs: {
    small: number;
    medium: number;
    large: number;
    damaged: number;
  };

  // Pricing (market rates)
  henEggPrice: number; // per dozen
  duckEggPrice: number; // per dozen

  // Totals
  totalHenEggs: number;
  totalDuckEggs: number;
  totalValue: number;

  // Quality notes
  qualityNotes?: string;

  synced: boolean;
}

// Staff Management
export interface Staff {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: Address;

  // Employment
  position: 'MANAGER' | 'CASHIER' | 'COLLECTOR' | 'ADMIN' | 'SUPERVISOR';
  department: 'SALES' | 'COLLECTION' | 'INVENTORY' | 'ADMIN' | 'MANAGEMENT';
  hireDate: Date;
  salary: number;

  // Permissions
  permissions: StaffPermission[];

  // Performance (for collectors)
  collectionRoutes?: string[];
  performanceMetrics?: {
    totalCollections: number;
    averageQuality: number;
    onTimeRate: number;
  };

  // System access
  username: string;
  password: string;
  lastLogin?: Date;
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type StaffPermission =
  | 'pos_sales' // Can make sales transactions
  | 'inventory_manage' // Can manage products
  | 'customer_manage' // Can manage customers
  | 'egg_collection' // Can collect eggs from farms
  | 'vendor_manage' // Can manage vendors
  | 'reports_view' // Can view reports
  | 'reports_export' // Can export reports
  | 'credit_approve' // Can approve credit transactions
  | 'settings_manage' // Can change system settings
  | 'staff_manage' // Can manage other staff
  | 'cash_handle'; // Can handle cash transactions

// Financial interfaces
export interface PaymentRecord {
  id: string;
  type: 'customer_payment' | 'vendor_payment';
  customerId?: string;
  vendorId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionIds?: string[]; // Which invoices this payment covers
  processBy: string;
  paymentDate: Date;
  notes?: string;
  staff?: any;
}

// Route Management (for egg collection)
export interface CollectionRoute {
  id: string;
  name: string;
  description?: string;
  farmerIds: string[];
  estimatedTime: number; // minutes
  distance: number; // km
  staffId?: string; // Assigned collector
  schedule: 'daily' | 'alternate' | 'weekly';
  active: boolean;
}

// Financial Reporting interfaces
export interface ProfitLossData {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;

  // Revenue streams
  revenue: {
    farmerSales: number;
    regularSales: number;
    eggSales: number;
    total: number;
  };

  // Cost of goods
  costOfGoods: {
    feedPurchases: number;
    medicinePurchases: number;
    eggPurchases: number;
    total: number;
  };

  // Operating expenses
  operatingExpenses: {
    salaries: number;
    fuel: number;
    utilities: number;
    interest: number;
    other: number;
    total: number;
  };

  // Calculated fields
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface CashFlowForecast {
  period: 'week' | 'month';
  startDate: Date;
  endDate: Date;

  // Money coming in
  expectedInflows: {
    customerPayments: number;
    eggSales: number;
    cashSales: number;
    total: number;
  };

  // Money going out
  expectedOutflows: {
    vendorPayments: number;
    eggPurchases: number;
    salaries: number;
    operatingExpenses: number;
    total: number;
  };

  // Net position
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

// Utility interfaces
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface NotificationPreferences {
  lowStock: boolean;
  paymentDue: boolean;
  eggCollection: boolean;
  creditLimit: boolean;
  systemErrors: boolean;
}

// System settings
export interface SystemSettings {
  store: {
    name: string;
    address: Address;
    phone: string;
    email: string;
    taxRate: number;
    currency: string;
  };

  credit: {
    defaultTerms: number;
    maxCreditLimit: number;
    interestRate: number;
    gracePeriod: number;
  };

  eggs: {
    defaultHenPrice: number;
    defaultDuckPrice: number;
    qualityGrades: string[];
    collectionSchedule: string;
  };

  notifications: NotificationPreferences;
}
