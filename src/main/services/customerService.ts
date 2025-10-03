// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

import { Customer } from '../../../src/renderer/types/core';
import { databaseService } from '../database';

export class CustomerServiceClass {
  // Retrieve held transaction
  async createCustomer(data: any): Promise<Customer> {
    try {
      const customer = await databaseService.create('customer', data);
      return customer; // Replace with actual vendor object
    } catch (error) {
      console.error('Failed to create customer', error);
      throw new Error('Failed to create customer');
    }
  }
  async getCustomers(): Promise<Customer[]> {
    try {
      const customers = await databaseService.findMany('customer');
      return customers as Customer[];
    } catch (error) {
      console.error('Failed to fetch customers', error);
      throw new Error('Failed to fetch customers');
    }
  }
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const customer = await databaseService.findById('customer', id);
      return customer as Customer;
    } catch (error) {
      console.error('Failed to fetch customer', error);
      throw new Error('Failed to fetch customer');
    }
  }
  async getCustomerTransactions(id: string): Promise<any[]> {
    try {
      const transactions = await databaseService.findMany('transaction', {
        where: { customer: { id: id } },
        include: { items: true },
      });
      return transactions as any[];
    } catch (error) {
      console.error('Failed to fetch customer transactions', error);
      throw new Error('Failed to fetch customer transactions');
    }
  }
  async updateCustomer(data: any): Promise<any> {
    try {
      const customer = await databaseService.update('customer', data.id, data);
      return customer as Customer;
    } catch (error) {
      console.error('Failed to fetch vendors', error);
      throw new Error('Failed to fetch vendors');
    }
  }
}

// Export singleton instance
export const CustomerService = new CustomerServiceClass();
