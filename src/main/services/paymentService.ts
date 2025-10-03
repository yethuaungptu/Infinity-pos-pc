// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

import { PaymentRecord } from '../../../src/renderer/types/core';
import { databaseService } from '../database';

export class PaymentRecordServiceClass {
  // Retrieve held transaction
  async createPaymentRecord(data: any): Promise<PaymentRecord> {
    try {
      console.log('Creating vendor with data:', data);
      const paymentRecord = await databaseService.create('paymentRecord', data);
      return paymentRecord; // Replace with actual vendor object
    } catch (error) {
      console.error('Failed to create paymentRecord', error);
      throw new Error('Failed to create paymentRecord');
    }
  }
  async getPaymentRecords(): Promise<PaymentRecord[]> {
    try {
      const paymentRecords = await databaseService.findMany('paymentRecord');
      return paymentRecords as PaymentRecord[];
    } catch (error) {
      console.error('Failed to fetch paymentRecords', error);
      throw new Error('Failed to fetch vendors');
    }
  }
  async getPaymentRecordsWithCustomerId(id: string): Promise<any> {
    try {
      const paymentRecord = await databaseService.findMany('paymentRecord', {
        where: { customerId: id },
        include: {
          staff: true,
        },
      });
      return paymentRecord as PaymentRecord;
    } catch (error) {
      console.error('Failed to fetch paymentRecords', error);
      throw new Error('Failed to fetch vendors');
    }
  }
  async updatePaymentRecord(data: any): Promise<any> {
    try {
      const paymentRecord = await databaseService.update(
        'paymentRecord',
        data.id,
        data,
      );
      return paymentRecord as PaymentRecord;
    } catch (error) {
      console.error('Failed to fetch paymentRecords', error);
      throw new Error('Failed to fetch paymentRecords');
    }
  }
}

// Export singleton instance
export const PaymentRecordService = new PaymentRecordServiceClass();
