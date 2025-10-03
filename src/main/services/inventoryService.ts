// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

import { Product } from '../../../src/renderer/types/core';
import { databaseService } from '../database';

export class InventoryServiceClass {
  // Retrieve held transaction
  async getAllProduct(): Promise<any> {
    try {
      const allProduct = await databaseService.getAllProducts();
      return allProduct;
    } catch (error) {
      console.error('Failed to retrieve held transaction:', error);
      throw new Error('Failed to retrieve held transaction');
    }
  }
  async createProduct(data: any): Promise<Product> {
    try {
      const product = await databaseService.create('product', data);
      return product; // Replace with actual product object
    } catch (error) {
      console.error('Failed to create product', error);
      throw new Error('Failed to create product');
    }
  }

  async updateProduct(data: any): Promise<any> {
    try {
      const product = await databaseService.update('product', data.id, data);
      return product as Product;
    } catch (error) {
      console.error('Failed to update product', error);
      throw new Error('Failed to update product');
    }
  }
}

// Export singleton instance
export const InventoryService = new InventoryServiceClass();
