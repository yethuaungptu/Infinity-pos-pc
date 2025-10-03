// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

import { Transaction } from '../../../src/renderer/types/core';
import { databaseService } from '../database';

export class TransactionServiceClass {
  // Retrieve held transaction
  async createTransaction(data: any): Promise<Transaction> {
    try {
      const transaction = await databaseService.create('transaction', data);
      return transaction; // Replace with actual vendor object
    } catch (error) {
      console.error('Failed to create transaction', error);
      throw new Error('Failed to create transaction');
    }
  }
  async getTransactions(): Promise<Transaction[]> {
    try {
      const transactions = await databaseService.findMany('transaction');
      return transactions as Transaction[];
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      throw new Error('Failed to fetch transactions');
    }
  }
  async updateTransaction(data: any): Promise<any> {
    try {
      const transaction = await databaseService.update(
        'transaction',
        data.id,
        data,
      );
      return transaction as Transaction;
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      throw new Error('Failed to fetch transactions');
    }
  }
}

// Export singleton instance
export const TransactionService = new TransactionServiceClass();
