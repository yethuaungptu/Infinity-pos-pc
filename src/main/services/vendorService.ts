// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

import { Vendor } from '../../../src/renderer/types/core';
import { databaseService } from '../database';

export class VendorServiceClass {
  // Retrieve held transaction
  async createVendor(data: any): Promise<Vendor> {
    try {
      console.log('Creating vendor with data:', data);
      const vendor = await databaseService.create('vendor', data);
      return vendor; // Replace with actual vendor object
    } catch (error) {
      console.error('Failed to create vendor', error);
      throw new Error('Failed to create vendor');
    }
  }
  async getVendors(): Promise<Vendor[]> {
    try {
      const vendors = await databaseService.findMany('vendor');
      return vendors as Vendor[];
    } catch (error) {
      console.error('Failed to fetch vendors', error);
      throw new Error('Failed to fetch vendors');
    }
  }
  async updateVendor(data: any): Promise<any> {
    try {
      const vendors = await databaseService.update('vendor', data.id, data);
      return vendors as Vendor;
    } catch (error) {
      console.error('Failed to fetch vendors', error);
      throw new Error('Failed to fetch vendors');
    }
  }
}

// Export singleton instance
export const VendorService = new VendorServiceClass();
