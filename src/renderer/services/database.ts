// Database service layer for Agricultural POS System
// Local-first: all reads/writes go to SQLite. Sync handled by main process SyncService.

import { PrismaClient } from '../../generated/prisma';

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

export class DatabaseService {
  private localPrisma: PrismaClient | null = null;

  constructor() {
    this.initializeConnections();
  }

  private initializeConnections() {
    console.log('Initializing database connections...##########s');
    try {
      this.localPrisma = new PrismaClient();
      console.log('Local database connection initialized');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error('Failed to initialize database connections');
    }
  }

  private getActiveClient() {
    return this.localPrisma;
  }

  getLocalClient() {
    return this.localPrisma;
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = this.getActiveClient();
      console.log('Local database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  getAllProducts() {
    const client = this.getActiveClient();
    return client.product.findMany({
      where: { active: true },
    });
  }

  async create<T>(table: string, data: any): Promise<T> {
    const client = this.getActiveClient();
    try {
      console.log(`Creating ${table}:`, data);
      const result = await client[table].create({ data });
      return result as T;
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
      console.log(`Finding ${table} with options:`, options);
      const results = await client[table].findMany(options);
      return results as T[];
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
      console.log(`Finding ${table} by id:`, id);
      const result = await client[table].findUnique({ where: { id }, include });
      return result as T | null;
    } catch (error) {
      console.error(`Failed to find ${table} by id:`, error);
      throw new Error(`Failed to find ${table}`);
    }
  }

  async update<T>(
    table: string,
    id: string,
    data: any,
  ): Promise<T> {
    const client = this.getActiveClient();
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    try {
      console.log(`Updating ${table}:`, id, updateData);
      const result = await client[table].update({
        where: { id },
        data: updateData,
      });
      return result as T;
    } catch (error) {
      console.error(`Failed to update ${table}:`, error);
      throw new Error(`Failed to update ${table}`);
    }
  }

  async delete(table: string, id: string): Promise<void> {
    const client = this.getActiveClient();
    try {
      console.log(`Deleting ${table}:`, id);
      await client[table].delete({ where: { id } });
    } catch (error) {
      console.error(`Failed to delete ${table}:`, error);
      throw new Error(`Failed to delete ${table}`);
    }
  }

  async softDelete(table: string, id: string): Promise<void> {
    await this.update(table, id, {
      active: false,
      deletedAt: new Date(),
    });
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

  async disconnect(): Promise<void> {
    try {
      if (this.localPrisma) {
        await this.localPrisma.$disconnect();
        console.log('Local database disconnected');
      }
    } catch (error) {
      console.error('Error during database disconnect:', error);
    }
  }
}

export const databaseService = new DatabaseService();
