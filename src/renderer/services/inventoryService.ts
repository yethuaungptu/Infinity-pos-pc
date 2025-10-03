// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

import { Product } from '../types/core';
import { databaseService } from './database';

export class InventoryServiceClass {
  // Retrieve held transaction
  async getAllProduct(): Promise<Product[]> {
    try {
      const allProduct = await databaseService.getAllProducts();
      return allProduct;
    } catch (error) {
      console.error('Failed to retrieve held transaction:', error);
      throw new Error('Failed to retrieve held transaction');
    }
  }
}

// Export singleton instance
export const InventoryService = new InventoryServiceClass();
