// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

import { Staff } from '../../../src/renderer/types/core';
import { databaseService } from '../database';
import bcrypt from 'bcryptjs';

export class StaffServiceClass {
  // Retrieve held transaction
  async createStaff(data: any): Promise<Staff> {
    try {
      const updateData = {
        ...data,
        password: bcrypt.hashSync(data.password, bcrypt.genSaltSync(10)),
      };
      const staff = await databaseService.create('staff', updateData);
      return staff; // Replace with actual vendor object
    } catch (error) {
      console.error('Failed to create staff', error);
      throw new Error('Failed to create staff');
    }
  }
  async getStaffs(): Promise<Staff[]> {
    try {
      const staffs = await databaseService.findMany('staff');
      return staffs as Staff[];
    } catch (error) {
      console.error('Failed to fetch staffs', error);
      throw new Error('Failed to fetch staffs');
    }
  }
  async updateStaff(data: any): Promise<any> {
    try {
      const { password, ...noPasswordData } = data;
      const updateData =
        data.password != ''
          ? {
              ...data,
              password: bcrypt.hashSync(data.password, bcrypt.genSaltSync(10)),
            }
          : noPasswordData;
      const staff = await databaseService.update('staff', data.id, updateData);
      return staff as Staff;
    } catch (error) {
      console.error('Failed to update staff', error);
      throw new Error('Failed to update staff');
    }
  }
}

// Export singleton instance
export const StaffService = new StaffServiceClass();
