import { databaseService } from '../database';
import { SyncService } from './syncService';
import bcrypt from 'bcryptjs';

const LICENSE_KEY = 'POS-ACTIVATE-2024';
const TRIAL_DAYS = 14;
const SETTING_ACTIVATED = 'LICENSE_ACTIVATED';
const SETTING_TRIAL_START = 'LICENSE_TRIAL_START';

export class LicenseServiceClass {
  async getSetting(key: string): Promise<string | null> {
    const settings = await databaseService.findMany('systemSetting', {
      where: { key },
      take: 1,
    });
    if (!settings || settings.length === 0) return null;
    return settings[0].value;
  }

  async setSetting(key: string, value: string) {
    const existing = await databaseService.findMany('systemSetting', {
      where: { key },
      take: 1,
    });
    if (existing && existing.length > 0) {
      await databaseService.update('systemSetting', existing[0].id, {
        value,
        type: 'STRING',
        category: 'license',
      });
    } else {
      await databaseService.create('systemSetting', {
        key,
        value,
        type: 'STRING',
        category: 'license',
        description: 'License setting',
      });
    }
  }

  async isActivated(): Promise<boolean> {
    const val = await this.getSetting(SETTING_ACTIVATED);
    return val === 'true';
  }

  async getTrialDaysRemaining(): Promise<number> {
    const startStr = await this.getSetting(SETTING_TRIAL_START);
    if (!startStr) {
      const now = new Date().toISOString();
      await this.setSetting(SETTING_TRIAL_START, now);
      return TRIAL_DAYS;
    }
    const start = new Date(startStr);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = TRIAL_DAYS - elapsed;
    return remaining > 0 ? remaining : 0;
  }

  async validateKey(key: string): Promise<boolean> {
    return key === LICENSE_KEY;
  }

  async activate(key: string): Promise<{ ok: boolean; message: string }> {
    const valid = await this.validateKey(key);
    if (!valid) {
      return { ok: false, message: 'Invalid license key.' };
    }
    await this.setSetting(SETTING_ACTIVATED, 'true');
    return { ok: true, message: 'License activated successfully.' };
  }

  async getLicenseStatus(): Promise<{
    activated: boolean;
    trialDaysRemaining: number;
    trialExpired: boolean;
    canLogin: boolean;
  }> {
    const activated = await this.isActivated();
    const trialDaysRemaining = await this.getTrialDaysRemaining();
    const trialExpired = trialDaysRemaining <= 0 && !activated;
    const canLogin = activated || trialDaysRemaining > 0;
    return { activated, trialDaysRemaining, trialExpired, canLogin };
  }

  async restoreFromCloud(): Promise<{ ok: boolean; message: string }> {
    try {
      await SyncService.restoreAllFromCloud();
      return { ok: true, message: 'Restore completed successfully.' };
    } catch (error: any) {
      return { ok: false, message: error.message || 'Restore failed.' };
    }
  }

  async ensureDefaultAdmin(): Promise<void> {
    try {
      const local = (await import('../database')).databaseService.getLocalClient();
      const count = await local.staff.count();
      if (count > 0) return;
      const hash = await bcrypt.hash('admin123', 10);
      await local.staff.create({
        data: {
          employeeId: 'EMP001',
          firstName: 'Admin',
          lastName: 'User',
          username: 'admin',
          password: hash,
          position: 'ADMIN',
          department: 'ADMIN',
          hireDate: new Date(),
          salary: 0,
          active: true,
        },
      });
      console.log('[license] Default admin user created (username: admin, password: admin123)');
    } catch (error) {
      console.warn('[license] Failed to create default admin:', error);
    }
  }
}

export const LicenseService = new LicenseServiceClass();
