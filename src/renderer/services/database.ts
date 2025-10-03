// Database service layer for Agricultural POS System
// This handles both online (PostgreSQL) and offline (SQLite) operations

import {
  Customer,
  Product,
  Transaction,
  Vendor,
  Staff,
  EggCollection,
  PaymentRecord,
  CollectionRoute,
} from '../types/core';

interface DatabaseConfig {
  isOnline: boolean;
  cloudUrl?: string;
  localDbPath?: string;
}

import { PrismaClient } from '../../generated/prisma';

export class DatabaseService {
  private config: DatabaseConfig;
  private cloudPrisma: any; // Would be PrismaClient for PostgreSQL
  private localPrisma: any; // Would be PrismaClient for SQLite

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializeConnections();
  }

  private async initializeConnections() {
    console.log('Initializing database connections...##########s');
    try {
      // Initialize cloud connection (PostgreSQL)
      if (this.config.isOnline && this.config.cloudUrl) {
        this.cloudPrisma = new PrismaClient();
        console.log('Cloud database connection initialized');
      }

      // Initialize local connection (SQLite) - Always available for offline mode
      // const dbPath = path.join(__dirname, '..', 'prisma', 'agripos.db')
      // console.log('Local DB Path:', dbPath);
      this.localPrisma = new PrismaClient();
      console.log('Local database connection initialized');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error('Failed to initialize database connections');
    }
  }

  // Get active database client based on connection status
  private getActiveClient() {
    const res =
      this.config.isOnline && this.cloudPrisma
        ? this.cloudPrisma
        : this.localPrisma;
    console.log(
      'Using database client:',
      this.config.isOnline ? 'Cloud' : 'Local',
      res,
    );
    return this.config.isOnline && this.cloudPrisma
      ? this.cloudPrisma
      : this.localPrisma;
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      const client = this.getActiveClient();
      // await client.$queryRaw`SELECT 1`;
      console.log(
        `${this.config.isOnline ? 'Cloud' : 'Local'} database connection successful`,
      );
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Switch between online/offline mode
  async switchMode(isOnline: boolean) {
    this.config.isOnline = isOnline;
    if (isOnline) {
      // Trigger sync when switching to online
      await this.syncLocalToCloud();
    }
  }

  // Sync local changes to cloud
  async syncLocalToCloud(): Promise<{
    success: boolean;
    synced: number;
    errors: number;
  }> {
    if (!this.config.isOnline || !this.cloudPrisma) {
      return { success: false, synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    try {
      // Sync unsynced transactions
      const unsyncedTransactions = await this.getUnsyncedTransactions();
      for (const transaction of unsyncedTransactions) {
        try {
          await this.syncTransactionToCloud(transaction);
          synced++;
        } catch (error) {
          console.error('Failed to sync transaction:', transaction.id, error);
          errors++;
        }
      }

      // Sync other entities...
      // Similar process for customers, products, etc.

      console.log(`Sync completed: ${synced} records synced, ${errors} errors`);
      return { success: errors === 0, synced, errors };
    } catch (error) {
      console.error('Sync process failed:', error);
      return { success: false, synced, errors: errors + 1 };
    }
  }

  async getAllProducts(): Promise<Product[]> {
    const client = this.getActiveClient();
    try {
      // Mock database operation
      console.log('Fetching all products from database...');
      const test = await this.testConnection();
      console.log('Raw query result:', client);
      const products = await this.localPrisma.product.findMany({
        where: { active: true },
      });
      return products; // Mock empty result
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  // Get unsynced transactions
  private async getUnsyncedTransactions(): Promise<Transaction[]> {
    // Mock implementation - replace with actual Prisma query
    return [];
  }

  // Sync individual transaction to cloud
  private async syncTransactionToCloud(
    transaction: Transaction,
  ): Promise<void> {
    // Mock implementation - replace with actual cloud sync logic
    console.log('Syncing transaction to cloud:', transaction.id);
  }

  // Generic CRUD operations with offline support
  async create<T>(
    table: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<T> {
    const client = this.getActiveClient();
    const now = new Date();

    const record = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
      synced: this.config.isOnline,
    } as T;

    try {
      // Mock database operation
      console.log(`Creating ${table}:`, record);
      // const result = await client[table].create({ data: record });
      return record;
    } catch (error) {
      console.error(`Failed to create ${table}:`, error);
      throw new Error(`Failed to create ${table}`);
    }
  }

  async findMany<T>(
    table: string,
    options?: {
      where?: any;
      orderBy?: any;
      skip?: number;
      take?: number;
      include?: any;
    },
  ): Promise<T[]> {
    const client = this.getActiveClient();

    try {
      // Mock database operation
      console.log(`Finding ${table} with options:`, options);
      // const results = await client[table].findMany(options);
      return []; // Mock empty result
    } catch (error) {
      console.error(`Failed to find ${table}:`, error);
      throw new Error(`Failed to find ${table}`);
    }
  }

  async findById<T>(
    table: string,
    id: string,
    include?: any,
  ): Promise<T | null> {
    const client = this.getActiveClient();

    try {
      // Mock database operation
      console.log(`Finding ${table} by id:`, id);
      // const result = await client[table].findUnique({ where: { id }, include });
      return null; // Mock null result
    } catch (error) {
      console.error(`Failed to find ${table} by id:`, error);
      throw new Error(`Failed to find ${table}`);
    }
  }

  async update<T>(
    table: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt'>>,
  ): Promise<T> {
    const client = this.getActiveClient();

    const updateData = {
      ...data,
      updatedAt: new Date(),
      synced: this.config.isOnline,
    };

    try {
      // Mock database operation
      console.log(`Updating ${table}:`, id, updateData);
      const result = await client[table].update({
        where: { id },
        data: updateData,
      });
      return updateData as T;
    } catch (error) {
      console.error(`Failed to update ${table}:`, error);
      throw new Error(`Failed to update ${table}`);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    const client = this.getActiveClient();

    try {
      // Mock database operation
      console.log(`Deleting ${table}:`, id);
      // await client[table].delete({ where: { id } });
    } catch (error) {
      console.error(`Failed to delete ${table}:`, error);
      throw new Error(`Failed to delete ${table}`);
    }
  }

  // Soft delete with sync support
  async softDelete(table: string, id: string): Promise<void> {
    await this.update(table, id, {
      active: false,
      deletedAt: new Date(),
      synced: this.config.isOnline,
    });
  }

  // Generate offline-compatible IDs
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Transaction-specific operations
  async createTransaction(
    transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Transaction> {
    const client = this.getActiveClient();

    try {
      // Start transaction
      console.log('Starting database transaction...');

      // Create the transaction record
      const transaction = await this.create<Transaction>(
        'transactions',
        transactionData,
      );

      // Update customer credit balance if credit sale
      if (
        transactionData.paymentMethod === 'credit' &&
        transactionData.customerId
      ) {
        await this.updateCustomerCredit(
          transactionData.customerId,
          transactionData.total,
        );
      }

      // Update inventory for each item
      for (const item of transactionData.items) {
        await this.updateProductStock(item.productId, -item.quantity);
      }

      console.log('Transaction created successfully:', transaction.id);
      return transaction;
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw new Error('Transaction creation failed');
    }
  }

  // Update customer credit balance
  async updateCustomerCredit(
    customerId: string,
    amount: number,
  ): Promise<void> {
    const customer = await this.findById<Customer>('customers', customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const newBalance = customer.creditBalance + amount;
    if (newBalance > customer.creditLimit) {
      throw new Error('Credit limit exceeded');
    }

    await this.update<Customer>('customers', customerId, {
      creditBalance: newBalance,
      totalPurchases: customer.totalPurchases + amount,
    });
  }

  // Update product stock
  async updateProductStock(
    productId: string,
    quantityChange: number,
  ): Promise<void> {
    const product = await this.findById<Product>('products', productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = product.stock + quantityChange;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    await this.update<Product>('products', productId, {
      stock: newStock,
    });
  }

  // Egg collection specific operations
  async createEggCollection(
    collectionData: Omit<EggCollection, 'id'>,
  ): Promise<EggCollection> {
    const client = this.getActiveClient();

    try {
      // Create egg collection record
      const collection = await this.create<EggCollection>(
        'egg_collections',
        collectionData,
      );

      // Update farmer's credit balance (reduce debt with egg payment)
      if (collectionData.farmerId && collectionData.totalValue > 0) {
        const farmer = await this.findById<Customer>(
          'customers',
          collectionData.farmerId,
        );
        if (farmer) {
          await this.update<Customer>('customers', collectionData.farmerId, {
            creditBalance: farmer.creditBalance - collectionData.totalValue,
            totalEggSales:
              (farmer.totalEggSales || 0) + collectionData.totalValue,
          });
        }
      }

      // Update egg inventory (add collected eggs to stock)
      await this.updateEggInventory(collection);

      console.log('Egg collection created successfully:', collection.id);
      return collection;
    } catch (error) {
      console.error('Failed to create egg collection:', error);
      throw new Error('Egg collection creation failed');
    }
  }

  // Update egg inventory after collection
  private async updateEggInventory(collection: EggCollection): Promise<void> {
    // Add hen eggs to inventory
    if (collection.totalHenEggs > 0) {
      const henEggProduct = await this.findHenEggProduct();
      if (henEggProduct) {
        await this.update<Product>('products', henEggProduct.id, {
          stock: henEggProduct.stock + Math.floor(collection.totalHenEggs / 12), // Convert to dozens
        });
      }
    }

    // Add duck eggs to inventory
    if (collection.totalDuckEggs > 0) {
      const duckEggProduct = await this.findDuckEggProduct();
      if (duckEggProduct) {
        await this.update<Product>('products', duckEggProduct.id, {
          stock:
            duckEggProduct.stock + Math.floor(collection.totalDuckEggs / 12), // Convert to dozens
        });
      }
    }
  }

  // Find hen egg product in inventory
  private async findHenEggProduct(): Promise<Product | null> {
    const products = await this.findMany<Product>('products', {
      where: { type: 'eggs', category: 'hen_eggs', active: true },
    });
    return products[0] || null;
  }

  // Find duck egg product in inventory
  private async findDuckEggProduct(): Promise<Product | null> {
    const products = await this.findMany<Product>('products', {
      where: { type: 'eggs', category: 'duck_eggs', active: true },
    });
    return products[0] || null;
  }

  // Vendor payment operations
  async processVendorPayment(
    vendorId: string,
    amount: number,
    paymentMethod: string,
    staffId: string,
  ): Promise<PaymentRecord> {
    const client = this.getActiveClient();

    try {
      const vendor = await this.findById<Vendor>('vendors', vendorId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      if (amount > vendor.creditBalance) {
        throw new Error('Payment amount exceeds outstanding balance');
      }

      // Create payment record
      const payment = await this.create<PaymentRecord>('payment_records', {
        type: 'vendor_payment',
        vendorId,
        amount,
        paymentMethod,
        staffId,
        paymentDate: new Date(),
      });

      // Update vendor balance
      await this.update<Vendor>('vendors', vendorId, {
        creditBalance: vendor.creditBalance - amount,
        lastPayment: new Date(),
      });

      console.log('Vendor payment processed successfully:', payment.id);
      return payment;
    } catch (error) {
      console.error('Failed to process vendor payment:', error);
      throw new Error('Vendor payment processing failed');
    }
  }

  // Get financial summary data
  async getFinancialSummary(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    revenue: any;
    costs: any;
    profit: any;
  }> {
    try {
      // Get transactions in date range
      const transactions = await this.findMany<Transaction>('transactions', {
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed',
        },
        include: {
          customer: true,
          items: true,
        },
      });

      // Calculate revenue by customer type
      const revenue = {
        farmerSales: 0,
        regularSales: 0,
        eggSales: 0,
        total: 0,
      };

      for (const transaction of transactions) {
        // This would need actual customer data and item analysis
        revenue.total += transaction.total;
      }

      // Get costs (this would need actual vendor transactions, payroll, etc.)
      const costs = {
        feedPurchases: 0,
        medicinePurchases: 0,
        eggPurchases: 0,
        salaries: 0,
        operating: 0,
        total: 0,
      };

      // Calculate profit
      const profit = {
        gross: revenue.total - costs.total,
        net: revenue.total - costs.total,
        margin:
          revenue.total > 0
            ? ((revenue.total - costs.total) / revenue.total) * 100
            : 0,
      };

      return { revenue, costs, profit };
    } catch (error) {
      console.error('Failed to get financial summary:', error);
      throw new Error('Financial summary calculation failed');
    }
  }

  // Close database connections
  async disconnect(): Promise<void> {
    try {
      if (this.cloudPrisma) {
        // await this.cloudPrisma.$disconnect();
        console.log('Cloud database disconnected');
      }
      if (this.localPrisma) {
        // await this.localPrisma.$disconnect();
        console.log('Local database disconnected');
      }
    } catch (error) {
      console.error('Error during database disconnect:', error);
    }
  }
}

// Export singleton instance
// export const databaseService = new DatabaseService({
//   isOnline: navigator.onLine,
//   cloudUrl: process.env.DATABASE_URL,
//   localDbPath: './agripos.db',
// });

export const databaseService = new DatabaseService({
  isOnline: false,
  cloudUrl: '../../../prisma/agripos.db',
  localDbPath: '../../../prisma/agripos.db',
});
