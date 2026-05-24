import { databaseService } from '../database';
import bcrypt from 'bcryptjs';
import { LicenseService } from './licenseService';
let currentStaff: any = null;

export class AuthServiceClass {

  async login(data: any): Promise<any> {
    try {
      const status = await LicenseService.getLicenseStatus();
      if (!status.canLogin) {
        throw new Error('License expired. Please enter a valid license key.');
      }

      const staff = await databaseService.login(data.username);
      if (!staff) throw new Error('Staff not found');
      const valid = await bcrypt.compare(data.password, staff.password);
      if (!valid) throw new Error('Invalid password');
      currentStaff = staff;
      return staff;
    } catch (error) {
      console.error('Failed to create staff', error);
      throw error;
    }
  }
  async logout(): Promise<any> {
    currentStaff = null;
  }
  async checkAuth(): Promise<any> {
    return currentStaff;
  }
}

export const AuthService = new AuthServiceClass();
