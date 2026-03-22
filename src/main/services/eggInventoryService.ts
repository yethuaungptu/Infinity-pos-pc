// Egg Inventory + Delivery Service (Main process)
// Handles egg inventory tracking and delivery scheduling

import { databaseService } from '../database';
import {
  EggDelivery,
  EggInventory,
  DeliveryStatus,
  PaymentMethod,
} from '../../../src/renderer/types/core';
import { EggCollectionService } from './eggCollectionService';

export interface EggInventoryAdjustment {
  henEggs: {
    small: number;
    medium: number;
    large: number;
    extraLarge: number;
  };
  duckEggs: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface EggDeliveryRequest {
  id?: string;
  customerId: string;
  staffId?: string;
  deliveryDate: string;
  status?: DeliveryStatus;
  henEggs: {
    small: number;
    medium: number;
    large: number;
    extraLarge: number;
  };
  duckEggs: {
    small: number;
    medium: number;
    large: number;
  };
  henEggPrice?: number;
  duckEggPrice?: number;
  paid?: boolean;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface EggDeliveryQuery {
  startDate?: string;
  endDate?: string;
  status?: DeliveryStatus;
  customerId?: string;
}

const sumEggs = (eggs: { [key: string]: number }) =>
  Object.values(eggs).reduce((sum, value) => sum + value, 0);

const mapDbToEggInventory = (record: any): EggInventory => ({
  id: record.id,
  henEggsSmall: record.henEggsSmall || 0,
  henEggsMedium: record.henEggsMedium || 0,
  henEggsLarge: record.henEggsLarge || 0,
  henEggsExtraLarge: record.henEggsExtraLarge || 0,
  duckEggsSmall: record.duckEggsSmall || 0,
  duckEggsMedium: record.duckEggsMedium || 0,
  duckEggsLarge: record.duckEggsLarge || 0,
  updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
});

const mapDbToEggDelivery = (record: any): EggDelivery => ({
  id: record.id,
  customerId: record.customerId,
  staffId: record.staffId || undefined,
  deliveryDate: new Date(record.deliveryDate),
  status: record.status,
  henEggs: {
    small: record.henEggsSmall || 0,
    medium: record.henEggsMedium || 0,
    large: record.henEggsLarge || 0,
    extraLarge: record.henEggsExtraLarge || 0,
  },
  duckEggs: {
    small: record.duckEggsSmall || 0,
    medium: record.duckEggsMedium || 0,
    large: record.duckEggsLarge || 0,
  },
  totalHenEggs: record.totalHenEggs || 0,
  totalDuckEggs: record.totalDuckEggs || 0,
  henEggPrice: record.henEggPrice || 0,
  duckEggPrice: record.duckEggPrice || 0,
  totalValue: record.totalValue || 0,
  paid: !!record.paid,
  paymentMethod: record.paymentMethod || undefined,
  notes: record.notes || undefined,
  createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
  updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
});

export class EggInventoryServiceClass {
  private async getOrCreateInventoryRecord(): Promise<any> {
    const existing = await databaseService.findMany('eggInventory' as any, {
      take: 1,
      orderBy: { updatedAt: 'desc' },
    });

    if (existing && existing.length > 0) {
      return existing[0];
    }

    return databaseService.create('eggInventory' as any, {
      henEggsSmall: 0,
      henEggsMedium: 0,
      henEggsLarge: 0,
      henEggsExtraLarge: 0,
      duckEggsSmall: 0,
      duckEggsMedium: 0,
      duckEggsLarge: 0,
    });
  }

  private async applyInventoryAdjustment(
    adjustment: EggInventoryAdjustment,
  ): Promise<EggInventory> {
    const record = await this.getOrCreateInventoryRecord();

    const next = {
      henEggsSmall: Math.max(0, (record.henEggsSmall || 0) + adjustment.henEggs.small),
      henEggsMedium: Math.max(0, (record.henEggsMedium || 0) + adjustment.henEggs.medium),
      henEggsLarge: Math.max(0, (record.henEggsLarge || 0) + adjustment.henEggs.large),
      henEggsExtraLarge: Math.max(
        0,
        (record.henEggsExtraLarge || 0) + adjustment.henEggs.extraLarge,
      ),
      duckEggsSmall: Math.max(0, (record.duckEggsSmall || 0) + adjustment.duckEggs.small),
      duckEggsMedium: Math.max(
        0,
        (record.duckEggsMedium || 0) + adjustment.duckEggs.medium,
      ),
      duckEggsLarge: Math.max(0, (record.duckEggsLarge || 0) + adjustment.duckEggs.large),
    };

    const updated = await databaseService.update(
      'eggInventory' as any,
      record.id,
      next,
    );

    return mapDbToEggInventory(updated);
  }

  async getEggInventory(): Promise<EggInventory> {
    const record = await this.getOrCreateInventoryRecord();
    return mapDbToEggInventory(record);
  }

  async adjustEggInventory(
    adjustment: EggInventoryAdjustment,
  ): Promise<EggInventory> {
    return this.applyInventoryAdjustment(adjustment);
  }

  private async resolveMarketPrices() {
    const market = await EggCollectionService.getMarketPrices();
    const henPrices = Object.values(market.henEggs);
    const duckPrices = Object.values(market.duckEggs);
    const henEggPrice = Math.round(
      henPrices.reduce((sum, value) => sum + value, 0) / henPrices.length,
    );
    const duckEggPrice = Math.round(
      duckPrices.reduce((sum, value) => sum + value, 0) / duckPrices.length,
    );
    return { henEggPrice, duckEggPrice };
  }

  async getEggDeliveries(query: EggDeliveryQuery = {}): Promise<EggDelivery[]> {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.deliveryDate = {};
      if (query.startDate) where.deliveryDate.gte = new Date(query.startDate);
      if (query.endDate) where.deliveryDate.lte = new Date(query.endDate);
    }
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    const records = await databaseService.findMany('eggDelivery' as any, {
      where,
      orderBy: { deliveryDate: 'desc' },
    });

    return (records as any[]).map(mapDbToEggDelivery);
  }

  async createEggDelivery(request: EggDeliveryRequest): Promise<EggDelivery> {
    const customer = await databaseService.findById(
      'customer',
      request.customerId,
    );
    if (!customer || (customer as any).type !== 'WHOLESALE') {
      throw new Error('Egg delivery is only available for wholesale customers');
    }

    const totalHenEggs = sumEggs(request.henEggs);
    const totalDuckEggs = sumEggs(request.duckEggs);

    const fallbackPrices = await this.resolveMarketPrices();
    const henEggPrice = Math.round(
      request.henEggPrice ?? fallbackPrices.henEggPrice,
    );
    const duckEggPrice = Math.round(
      request.duckEggPrice ?? fallbackPrices.duckEggPrice,
    );

    const totalValue = Math.round(
      (totalHenEggs / 12) * henEggPrice +
        (totalDuckEggs / 12) * duckEggPrice,
    );

    const status = request.status || 'SCHEDULED';

    const record = await databaseService.create('eggDelivery' as any, {
      customerId: request.customerId,
      staffId: request.staffId || null,
      deliveryDate: new Date(request.deliveryDate),
      status,
      henEggsSmall: request.henEggs.small,
      henEggsMedium: request.henEggs.medium,
      henEggsLarge: request.henEggs.large,
      henEggsExtraLarge: request.henEggs.extraLarge,
      totalHenEggs,
      duckEggsSmall: request.duckEggs.small,
      duckEggsMedium: request.duckEggs.medium,
      duckEggsLarge: request.duckEggs.large,
      totalDuckEggs,
      henEggPrice,
      duckEggPrice,
      totalValue,
      paid: !!request.paid,
      paymentMethod: request.paymentMethod || null,
      notes: request.notes || null,
    });

    if (status === 'DELIVERED') {
      await this.applyInventoryAdjustment({
        henEggs: {
          small: -request.henEggs.small,
          medium: -request.henEggs.medium,
          large: -request.henEggs.large,
          extraLarge: -request.henEggs.extraLarge,
        },
        duckEggs: {
          small: -request.duckEggs.small,
          medium: -request.duckEggs.medium,
          large: -request.duckEggs.large,
        },
      });
    }

    return mapDbToEggDelivery(record);
  }

  async updateEggDelivery(request: EggDeliveryRequest): Promise<EggDelivery> {
    if (!request.id) {
      throw new Error('Delivery ID is required');
    }

    const existing = await databaseService.findById(
      'eggDelivery' as any,
      request.id,
    );
    if (!existing) {
      throw new Error('Egg delivery not found');
    }

    const totalHenEggs = sumEggs(request.henEggs);
    const totalDuckEggs = sumEggs(request.duckEggs);

    const fallbackPrices = await this.resolveMarketPrices();
    const henEggPrice = Math.round(
      request.henEggPrice ?? fallbackPrices.henEggPrice,
    );
    const duckEggPrice = Math.round(
      request.duckEggPrice ?? fallbackPrices.duckEggPrice,
    );

    const totalValue = Math.round(
      (totalHenEggs / 12) * henEggPrice +
        (totalDuckEggs / 12) * duckEggPrice,
    );

    const status = request.status || existing.status;

    const record = await databaseService.update(
      'eggDelivery' as any,
      request.id,
      {
        customerId: request.customerId,
        staffId: request.staffId || null,
        deliveryDate: new Date(request.deliveryDate),
        status,
        henEggsSmall: request.henEggs.small,
        henEggsMedium: request.henEggs.medium,
        henEggsLarge: request.henEggs.large,
        henEggsExtraLarge: request.henEggs.extraLarge,
        totalHenEggs,
        duckEggsSmall: request.duckEggs.small,
        duckEggsMedium: request.duckEggs.medium,
        duckEggsLarge: request.duckEggs.large,
        totalDuckEggs,
        henEggPrice,
        duckEggPrice,
        totalValue,
        paid: !!request.paid,
        paymentMethod: request.paymentMethod || null,
        notes: request.notes || null,
      },
    );

    if (existing.status !== 'DELIVERED' && status === 'DELIVERED') {
      await this.applyInventoryAdjustment({
        henEggs: {
          small: -request.henEggs.small,
          medium: -request.henEggs.medium,
          large: -request.henEggs.large,
          extraLarge: -request.henEggs.extraLarge,
        },
        duckEggs: {
          small: -request.duckEggs.small,
          medium: -request.duckEggs.medium,
          large: -request.duckEggs.large,
        },
      });
    }

    if (existing.status === 'DELIVERED' && status !== 'DELIVERED') {
      await this.applyInventoryAdjustment({
        henEggs: {
          small: existing.henEggsSmall || 0,
          medium: existing.henEggsMedium || 0,
          large: existing.henEggsLarge || 0,
          extraLarge: existing.henEggsExtraLarge || 0,
        },
        duckEggs: {
          small: existing.duckEggsSmall || 0,
          medium: existing.duckEggsMedium || 0,
          large: existing.duckEggsLarge || 0,
        },
      });
    }

    return mapDbToEggDelivery(record);
  }

  async deleteEggDelivery(id: string): Promise<void> {
    await databaseService.delete('eggDelivery' as any, id);
  }
}

export const EggInventoryService = new EggInventoryServiceClass();
