// POS Service - Handles all point-of-sale operations
// Includes sales transactions, credit management, and inventory updates

import { databaseService } from '../database';
import bcrypt from 'bcryptjs';
let currentStaff: any = null;

export class AuthServiceClass {
  // Retrieve held transaction

  async login(data: any): Promise<any> {
    try {
      const staff = await databaseService.login(data.username);
      if (!staff) throw new Error('Staff not found');
      const valid = await bcrypt.compare(data.password, staff.password);
      if (!valid) throw new Error('Invalid password');
      currentStaff = staff;
      return staff; // Replace with actual vendor object
    } catch (error) {
      console.error('Failed to create staff', error);
      throw new Error('Failed to create staff');
    }
  }
  async logout(): Promise<any> {
    currentStaff = null;
  }
  async checkAuth(): Promise<any> {
    return currentStaff;
  }
}

// Export singleton instance
export const AuthService = new AuthServiceClass();
