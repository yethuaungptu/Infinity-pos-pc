// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

// import {  } from '../../../src/renderer/types/core';
import { includes } from 'lodash';
import { databaseService } from '../database';

export class PurchaseServiceClass {
  // Retrieve held transaction
  async createPurchase(data: any): Promise<any> {
    try {
      const purchase = await databaseService.create('purchaseOrder', data);
      return purchase; // Replace with actual vendor object
    } catch (error) {
      console.error('Failed to create purchase', error);
      throw new Error('Failed to create purchase');
    }
  }
  async getPurchases(): Promise<any[]> {
    try {
      const purchases = await databaseService.findMany('purchaseOrder', {
        include: {
          vendor: {
            select: {
              companyName: true,
              id: true,
            },
          },
          staff: {
            select: {
              id: true,
              username: true,
            },
          },
          items: true,
        },
      });
      return purchases as any[];
    } catch (error) {
      console.error('Failed to fetch purchases', error);
      throw new Error('Failed to fetch purchases');
    }
  }
  async getPurchaseDetail(id: string): Promise<any> {
    try {
      const purchase = await databaseService.findById('purchaseOrder', id, {
        vendor: {
          select: {
            companyName: true,
            id: true,
          },
        },
        staff: {
          select: {
            id: true,
            username: true,
          },
        },
        items: true,
      });
      return purchase as any;
    } catch (error) {
      console.error('Failed to update purchase', error);
      throw new Error('Failed to update purchase');
    }
  }
  async getPurchaseByVendor(id: string): Promise<any> {
    try {
      const purchases = await databaseService.findMany('purchaseOrder', {
        where: {
          vendorId: id,
        },
        include: {
          vendor: {
            select: {
              companyName: true,
              id: true,
            },
          },
          staff: {
            select: {
              id: true,
              username: true,
            },
          },
          items: true,
        },
      });
      return purchases as any[];
    } catch (error) {
      console.error('Failed to fetch purchases', error);
      throw new Error('Failed to fetch purchases');
    }
  }
  async updatePurchase(data: any): Promise<any> {
    try {
      const purchase = await databaseService.update(
        'purchaseOrder',
        data.id,
        data,
      );
      return purchase as any;
    } catch (error) {
      console.error('Failed to update purchase', error);
      throw new Error('Failed to update purchase');
    }
  }
}

// Export singleton instance
export const PurchaseService = new PurchaseServiceClass();
