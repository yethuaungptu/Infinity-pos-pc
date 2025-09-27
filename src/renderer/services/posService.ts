// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

import {
  Customer,
  Product,
  Transaction,
  TransactionItem,
  PaymentMethod,
  CustomerType,
  TransactionStatus,
} from '../types/core';
import { databaseService } from './database';
import { printService } from './printService';
import { notificationService } from './notificationService';

export interface SaleRequest {
  customerId?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentMethod: PaymentMethod;
  discount?: number;
  notes?: string;
  staffId: string;
}

export interface SaleResult {
  transaction: Transaction;
  receiptData: any;
  warnings: string[];
}

export class POSService {
  private taxRate = 0.08; // 8% default tax rate

  // Process a complete sale transaction
  async processSale(saleRequest: SaleRequest): Promise<SaleResult> {
    const warnings: string[] = [];

    try {
      // Validate sale request
      await this.validateSaleRequest(saleRequest);

      // Get customer data if provided
      const customer = saleRequest.customerId
        ? await databaseService.findById<Customer>(
            'customers',
            saleRequest.customerId,
          )
        : null;

      // Build transaction items with pricing
      const transactionItems: TransactionItem[] = [];
      let subtotal = 0;

      for (const item of saleRequest.items) {
        const product = await databaseService.findById<Product>(
          'products',
          item.productId,
        );
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        // Check stock availability
        if (product.stock < item.quantity) {
          if (product.stock === 0) {
            throw new Error(`Product "${product.name}" is out of stock`);
          } else {
            warnings.push(
              `Low stock for "${product.name}": only ${product.stock} remaining`,
            );
          }
        }

        // Get customer-specific pricing
        const unitPrice = this.getCustomerPrice(product, customer);
        const itemTotal = unitPrice * item.quantity;

        const transactionItem: TransactionItem = {
          id: this.generateItemId(),
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unit: product.unit,
          unitPrice: unitPrice,
          total: itemTotal,
          batchNumber: product.batchNumber,
          expiryDate: product.expiryDate,
        };

        transactionItems.push(transactionItem);
        subtotal += itemTotal;
      }

      // Apply discount
      const discount = saleRequest.discount || 0;
      const discountAmount = subtotal * (discount / 100);
      const subtotalAfterDiscount = subtotal - discountAmount;

      // Calculate tax
      const tax = subtotalAfterDiscount * this.taxRate;
      const total = subtotalAfterDiscount + tax;

      // Validate credit limit for credit sales
      if (saleRequest.paymentMethod === 'credit') {
        if (!customer) {
          throw new Error('Customer required for credit sales');
        }
        await this.validateCreditLimit(customer, total);
      }

      // Create transaction
      const transactionData: Omit<
        Transaction,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        receiptNumber: await this.generateReceiptNumber(),
        type: 'sale',
        customerId: customer?.id,
        items: transactionItems,
        subtotal: subtotal,
        tax: tax,
        discount: discountAmount,
        total: total,
        paymentMethod: saleRequest.paymentMethod,
        paidAmount: saleRequest.paymentMethod === 'credit' ? 0 : total,
        balanceAmount: saleRequest.paymentMethod === 'credit' ? total : 0,
        status: 'completed',
        staffId: saleRequest.staffId,
        timestamp: new Date(),
        dueDate: this.calculateDueDate(customer, saleRequest.paymentMethod),
        notes: saleRequest.notes,
        synced: false,
      };

      // Save transaction (this also updates inventory and customer credit)
      const transaction =
        await databaseService.createTransaction(transactionData);

      // Generate receipt data
      const receiptData = await this.generateReceiptData(transaction, customer);

      // Send notifications for important events
      await this.sendNotifications(transaction, customer, warnings);

      // Print receipt if cash sale or requested
      if (saleRequest.paymentMethod === 'cash') {
        try {
          await printService.printReceipt(receiptData);
        } catch (error) {
          console.error('Print failed:', error);
          warnings.push('Receipt printing failed - please print manually');
        }
      }

      return {
        transaction,
        receiptData,
        warnings,
      };
    } catch (error: any) {
      console.error('Sale processing failed:', error);
      throw new Error(`Sale processing failed: ${error.message}`);
    }
  }

  // Validate sale request
  private async validateSaleRequest(saleRequest: SaleRequest): Promise<void> {
    if (!saleRequest.items || saleRequest.items.length === 0) {
      throw new Error('No items in sale');
    }

    if (!saleRequest.staffId) {
      throw new Error('Staff ID required');
    }

    // Validate each item
    for (const item of saleRequest.items) {
      if (!item.productId || item.quantity <= 0) {
        throw new Error('Invalid item in sale request');
      }

      const product = await databaseService.findById<Product>(
        'products',
        item.productId,
      );
      if (!product || !product.active) {
        throw new Error(`Invalid or inactive product: ${item.productId}`);
      }
    }
  }

  // Get customer-specific pricing
  private getCustomerPrice(
    product: Product,
    customer: Customer | null,
  ): number {
    if (!customer) {
      return product.sellingPrice;
    }

    switch (customer.type) {
      case 'farmer':
        // Farmers get wholesale pricing on feed and medicine
        if (product.type === 'feed' || product.type === 'medicine') {
          return product.wholesalePrice || product.sellingPrice;
        }
        return product.sellingPrice;

      case 'wholesale':
        // Wholesale customers get wholesale pricing on eggs
        if (product.type === 'eggs') {
          return product.wholesalePrice || product.sellingPrice;
        }
        return product.sellingPrice;

      case 'regular':
      default:
        return product.sellingPrice;
    }
  }

  // Validate customer credit limit
  private async validateCreditLimit(
    customer: Customer,
    saleAmount: number,
  ): Promise<void> {
    const availableCredit = customer.creditLimit - customer.creditBalance;

    if (saleAmount > availableCredit) {
      throw new Error(
        `Credit limit exceeded. Available credit: $${availableCredit.toFixed(2)}, Sale amount: $${saleAmount.toFixed(2)}`,
      );
    }

    // Check if customer is in good standing
    if (customer.creditStatus !== 'current') {
      if (customer.creditStatus === 'bad_debt') {
        throw new Error(
          'Cannot process credit sale - customer has bad debt status',
        );
      }

      // Allow sales but with warning for overdue accounts
      if (customer.creditStatus.includes('overdue')) {
        console.warn(`Customer has overdue payments: ${customer.creditStatus}`);
      }
    }
  }

  // Calculate due date for credit sales
  private calculateDueDate(
    customer: Customer | null,
    paymentMethod: PaymentMethod,
  ): Date | undefined {
    if (paymentMethod !== 'credit' || !customer) {
      return undefined;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + customer.paymentTerms);
    return dueDate;
  }

  // Generate receipt data
  private async generateReceiptData(
    transaction: Transaction,
    customer: Customer | null,
  ) {
    const store = await this.getStoreInfo();

    return {
      store,
      transaction,
      customer,
      items: transaction.items,
      totals: {
        subtotal: transaction.subtotal,
        discount: transaction.discount,
        tax: transaction.tax,
        total: transaction.total,
      },
      payment: {
        method: transaction.paymentMethod,
        paidAmount: transaction.paidAmount,
        balanceAmount: transaction.balanceAmount,
        dueDate: transaction.dueDate,
      },
      footer:
        customer?.type === 'farmer'
          ? 'Thank you for your business! Next egg collection scheduled.'
          : 'Thank you for shopping with us!',
      timestamp: transaction.timestamp,
    };
  }

  // Send notifications for important events
  private async sendNotifications(
    transaction: Transaction,
    customer: Customer | null,
    warnings: string[],
  ): Promise<void> {
    try {
      // Low stock notifications
      for (const item of transaction.items) {
        const product = await databaseService.findById<Product>(
          'products',
          item.productId,
        );
        if (product && product.stock - item.quantity <= product.minimumStock) {
          await notificationService.sendLowStockAlert(product);
        }
      }

      // Credit limit notifications
      if (customer && transaction.paymentMethod === 'credit') {
        const newBalance = customer.creditBalance + transaction.total;
        const utilizationRate = (newBalance / customer.creditLimit) * 100;

        if (utilizationRate >= 80) {
          await notificationService.sendCreditLimitAlert(
            customer,
            utilizationRate,
          );
        }
      }

      // Large transaction notification
      if (transaction.total >= 1000) {
        await notificationService.sendLargeTransactionAlert(transaction);
      }
    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  }

  // Process refund
  async processRefund(
    transactionId: string,
    refundAmount: number,
    reason: string,
    staffId: string,
  ): Promise<Transaction> {
    try {
      const originalTransaction = await databaseService.findById<Transaction>(
        'transactions',
        transactionId,
      );
      if (!originalTransaction) {
        throw new Error('Original transaction not found');
      }

      if (originalTransaction.status === 'refunded') {
        throw new Error('Transaction already refunded');
      }

      if (refundAmount > originalTransaction.total) {
        throw new Error(
          'Refund amount cannot exceed original transaction amount',
        );
      }

      // Create refund transaction
      const refundTransaction = await databaseService.create<Transaction>(
        'transactions',
        {
          receiptNumber: await this.generateReceiptNumber('REFUND'),
          type: 'sale',
          customerId: originalTransaction.customerId,
          items: originalTransaction.items.map((item) => ({
            ...item,
            quantity: -Math.abs(item.quantity), // Negative quantities for refund
            total: -Math.abs(item.total),
          })),
          subtotal: -refundAmount,
          tax: -((refundAmount * this.taxRate) / (1 + this.taxRate)),
          discount: 0,
          total: -refundAmount,
          paymentMethod: originalTransaction.paymentMethod,
          paidAmount: -refundAmount,
          balanceAmount: 0,
          status: 'completed',
          staffId: staffId,
          timestamp: new Date(),
          notes: `Refund for ${originalTransaction.receiptNumber} - ${reason}`,
          synced: false,
        },
      );

      // Update original transaction status
      await databaseService.update<Transaction>('transactions', transactionId, {
        status:
          refundAmount === originalTransaction.total ? 'refunded' : 'completed',
        notes: `${originalTransaction.notes || ''}\nPartial refund processed: $${refundAmount}`,
      });

      // Restore inventory
      for (const item of originalTransaction.items) {
        await databaseService.updateProductStock(item.productId, item.quantity);
      }

      // Adjust customer credit if applicable
      if (
        originalTransaction.customerId &&
        originalTransaction.paymentMethod === 'credit'
      ) {
        const customer = await databaseService.findById<Customer>(
          'customers',
          originalTransaction.customerId,
        );
        if (customer) {
          await databaseService.update<Customer>('customers', customer.id, {
            creditBalance: customer.creditBalance - refundAmount,
            totalPurchases: customer.totalPurchases - refundAmount,
          });
        }
      }

      console.log(
        `Refund processed: $${refundAmount} for transaction ${originalTransaction.receiptNumber}`,
      );
      return refundTransaction;
    } catch (error: any) {
      console.error('Refund processing failed:', error);
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  // Hold/Park a transaction (for later completion)
  async holdTransaction(
    saleRequest: SaleRequest,
    holdReason: string,
  ): Promise<string> {
    const holdId = `HOLD_${Date.now()}`;

    try {
      // Store in temporary storage (could be localStorage or database)
      const holdData = {
        id: holdId,
        saleRequest,
        holdReason,
        timestamp: new Date(),
        staffId: saleRequest.staffId,
      };

      // For now, store in localStorage (in production, use proper storage)
      localStorage.setItem(holdId, JSON.stringify(holdData));

      console.log('Transaction held:', holdId);
      return holdId;
    } catch (error) {
      console.error('Failed to hold transaction:', error);
      throw new Error('Failed to hold transaction');
    }
  }

  // Retrieve held transaction
  async retrieveHeldTransaction(holdId: string): Promise<SaleRequest> {
    try {
      const holdData = localStorage.getItem(holdId);
      if (!holdData) {
        throw new Error('Held transaction not found');
      }

      const parsedData = JSON.parse(holdData);

      // Remove from storage after retrieval
      localStorage.removeItem(holdId);

      console.log('Retrieved held transaction:', holdId);
      return parsedData.saleRequest;
    } catch (error) {
      console.error('Failed to retrieve held transaction:', error);
      throw new Error('Failed to retrieve held transaction');
    }
  }

  // Get all held transactions
  async getHeldTransactions(): Promise<
    Array<{
      id: string;
      saleRequest: SaleRequest;
      holdReason: string;
      timestamp: Date;
    }>
  > {
    const heldTransactions = [];

    try {
      // Scan localStorage for held transactions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('HOLD_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsedData = JSON.parse(data);
            heldTransactions.push({
              id: key,
              saleRequest: parsedData.saleRequest,
              holdReason: parsedData.holdReason,
              timestamp: new Date(parsedData.timestamp),
            });
          }
        }
      }

      return heldTransactions;
    } catch (error) {
      console.error('Failed to get held transactions:', error);
      return [];
    }
  }

  // Clear held transaction
  async clearHeldTransaction(holdId: string): Promise<void> {
    try {
      localStorage.removeItem(holdId);
      console.log('Cleared held transaction:', holdId);
    } catch (error) {
      console.error('Failed to clear held transaction:', error);
    }
  }

  // Get sales summary for period
  async getSalesSummary(
    startDate: Date,
    endDate: Date,
    staffId?: string,
  ): Promise<{
    totalSales: number;
    totalTransactions: number;
    averageTransaction: number;
    paymentBreakdown: Record<PaymentMethod, number>;
    customerTypeBreakdown: Record<CustomerType, number>;
    topProducts: Array<{
      productId: string;
      productName: string;
      quantity: number;
      revenue: number;
    }>;
  }> {
    try {
      const transactions = await databaseService.findMany<Transaction>(
        'transactions',
        {
          where: {
            timestamp: { gte: startDate, lte: endDate },
            status: 'completed',
            type: 'sale',
            ...(staffId && { staffId }),
          },
          include: {
            customer: true,
            items: true,
          },
        },
      );

      const summary = {
        totalSales: 0,
        totalTransactions: transactions.length,
        averageTransaction: 0,
        paymentBreakdown: {} as Record<PaymentMethod, number>,
        customerTypeBreakdown: {} as Record<CustomerType, number>,
        topProducts: [] as Array<{
          productId: string;
          productName: string;
          quantity: number;
          revenue: number;
        }>,
      };

      const productStats = new Map<
        string,
        { name: string; quantity: number; revenue: number }
      >();

      for (const transaction of transactions) {
        // Total sales
        summary.totalSales += transaction.total;

        // Payment method breakdown
        summary.paymentBreakdown[transaction.paymentMethod] =
          (summary.paymentBreakdown[transaction.paymentMethod] || 0) +
          transaction.total;

        // Customer type breakdown (would need actual customer data)
        // This is a simplified version
        const customerType = transaction.customerId ? 'farmer' : 'regular'; // Mock logic
        summary.customerTypeBreakdown[customerType as CustomerType] =
          (summary.customerTypeBreakdown[customerType as CustomerType] || 0) +
          transaction.total;

        // Product statistics
        for (const item of transaction.items) {
          const existing = productStats.get(item.productId);
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += item.total;
          } else {
            productStats.set(item.productId, {
              name: item.productName,
              quantity: item.quantity,
              revenue: item.total,
            });
          }
        }
      }

      // Calculate average transaction
      summary.averageTransaction =
        summary.totalTransactions > 0
          ? summary.totalSales / summary.totalTransactions
          : 0;

      // Get top 10 products by revenue
      summary.topProducts = Array.from(productStats.entries())
        .map(([productId, stats]) => ({
          productId,
          productName: stats.name,
          quantity: stats.quantity,
          revenue: stats.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return summary;
    } catch (error) {
      console.error('Failed to get sales summary:', error);
      throw new Error('Failed to calculate sales summary');
    }
  }

  // Get transaction details with full information
  async getTransactionDetails(transactionId: string): Promise<
    Transaction & {
      customer?: Customer;
      staff?: any;
      relatedTransactions?: Transaction[];
    }
  > {
    try {
      const transaction = await databaseService.findById<Transaction>(
        'transactions',
        transactionId,
        {
          include: {
            customer: true,
            staff: true,
          },
        },
      );

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Get related transactions (refunds, adjustments)
      const relatedTransactions = await databaseService.findMany<Transaction>(
        'transactions',
        {
          where: {
            notes: { contains: transaction.receiptNumber },
            id: { not: transactionId },
          },
        },
      );

      return {
        ...transaction,
        relatedTransactions,
      };
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      throw new Error('Failed to get transaction details');
    }
  }

  // Check product availability
  async checkProductAvailability(
    productId: string,
    requestedQuantity: number,
  ): Promise<{
    available: boolean;
    currentStock: number;
    canFulfill: boolean;
    suggestions?: string[];
  }> {
    try {
      const product = await databaseService.findById<Product>(
        'products',
        productId,
      );

      if (!product) {
        return {
          available: false,
          currentStock: 0,
          canFulfill: false,
          suggestions: ['Product not found'],
        };
      }

      if (!product.active) {
        return {
          available: false,
          currentStock: product.stock,
          canFulfill: false,
          suggestions: ['Product is inactive'],
        };
      }

      const suggestions: string[] = [];

      // Check expiry for perishable items
      if (product.expiryDate && product.expiryDate < new Date()) {
        suggestions.push('Product has expired');
        return {
          available: false,
          currentStock: product.stock,
          canFulfill: false,
          suggestions,
        };
      }

      // Check if near expiry (within 30 days)
      if (product.expiryDate) {
        const daysUntilExpiry = Math.ceil(
          (product.expiryDate.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (daysUntilExpiry <= 30) {
          suggestions.push(`Product expires in ${daysUntilExpiry} days`);
        }
      }

      // Check stock levels
      const canFulfill = product.stock >= requestedQuantity;

      if (!canFulfill && product.stock > 0) {
        suggestions.push(
          `Only ${product.stock} units available (requested ${requestedQuantity})`,
        );
      } else if (product.stock === 0) {
        suggestions.push('Product is out of stock');
      }

      // Check if stock is below minimum
      if (product.stock <= product.minimumStock) {
        suggestions.push('Low stock - consider reordering');
      }

      return {
        available: product.active && product.stock > 0,
        currentStock: product.stock,
        canFulfill,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    } catch (error) {
      console.error('Failed to check product availability:', error);
      return {
        available: false,
        currentStock: 0,
        canFulfill: false,
        suggestions: ['Error checking availability'],
      };
    }
  }

  // Generate unique receipt number
  private async generateReceiptNumber(prefix: string = 'RCP'): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-4);
    return `${prefix}-${dateStr}-${timeStr}`;
  }

  // Generate unique item ID
  private generateItemId(): string {
    return `ITEM_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  }

  // Get store information for receipts
  private async getStoreInfo() {
    // This would typically come from settings/database
    return {
      name: 'AgriSupply Store',
      address: '123 Farm Road, Agriculture Valley',
      phone: '+1 (555) 123-4567',
      email: 'info@agrisupply.com',
      taxId: 'TAX123456789',
      logo: null, // Could be base64 image data
    };
  }

  // Validate receipt for reprint
  async validateReceiptForReprint(
    receiptNumber: string,
  ): Promise<Transaction | null> {
    try {
      const transactions = await databaseService.findMany<Transaction>(
        'transactions',
        {
          where: { receiptNumber },
          include: { customer: true, items: true },
        },
      );

      return transactions[0] || null;
    } catch (error) {
      console.error('Failed to validate receipt:', error);
      return null;
    }
  }

  // Reprint receipt
  async reprintReceipt(receiptNumber: string, staffId: string): Promise<void> {
    try {
      const transaction = await this.validateReceiptForReprint(receiptNumber);
      if (!transaction) {
        throw new Error('Receipt not found');
      }

      const customer = transaction.customerId
        ? await databaseService.findById<Customer>(
            'customers',
            transaction.customerId,
          )
        : null;

      const receiptData = await this.generateReceiptData(transaction, customer);

      // Add reprint indicator
      receiptData.isReprint = true;
      receiptData.reprintedBy = staffId;
      receiptData.reprintTime = new Date();

      await printService.printReceipt(receiptData);

      console.log(`Receipt reprinted: ${receiptNumber} by staff ${staffId}`);
    } catch (error: any) {
      console.error('Failed to reprint receipt:', error);
      throw new Error(`Failed to reprint receipt: ${error.message}`);
    }
  }
}

// Export singleton instance
export const posService = new POSService();
