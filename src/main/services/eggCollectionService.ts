// Egg Collection Service (Main process)
// Handles egg collection persistence and calculations

import { databaseService } from '../database';
import { EggCollection } from '../../../src/renderer/types/core';

export interface EggCollectionRequest {
  farmerId: string;
  routeId?: string;
  staffId: string;
  collectionDate?: string;
  henEggs: {
    small: number;
    medium: number;
    large: number;
    extraLarge: number;
    damaged: number;
  };
  duckEggs: {
    small: number;
    medium: number;
    large: number;
    damaged: number;
  };
  henEggPrice: number;
  duckEggPrice: number;
  qualityNotes?: string;
}

export interface EggCollectionQuery {
  startDate: string;
  endDate: string;
  routeId?: string;
  staffId?: string;
}

export interface CollectionRoutePayload {
  id?: string;
  name: string;
  description?: string;
  farmerIds: string[];
  estimatedTime: number;
  distance: number;
  staffId?: string;
  schedule: 'DAILY' | 'ALTERNATE' | 'WEEKLY' | 'CUSTOM';
  active: boolean;
}

export interface MarketPrices {
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
  lastUpdated: Date;
}

const MARKET_PRICES_SETTING_KEY = 'MARKET_PRICES';

const calculateTotalEggs = (eggBreakdown: { [key: string]: number }) =>
  Object.values(eggBreakdown).reduce((sum, count) => sum + count, 0);

const mapDbToEggCollection = (record: any): EggCollection => ({
  id: record.id,
  farmerId: record.farmerId,
  collectionDate: new Date(record.collectionDate),
  routeId: record.routeId || undefined,
  staffId: record.staffId,
  henEggs: {
    small: record.henEggsSmall || 0,
    medium: record.henEggsMedium || 0,
    large: record.henEggsLarge || 0,
    extraLarge: record.henEggsExtraLarge || 0,
    damaged: record.henEggsDamaged || 0,
  },
  duckEggs: {
    small: record.duckEggsSmall || 0,
    medium: record.duckEggsMedium || 0,
    large: record.duckEggsLarge || 0,
    damaged: record.duckEggsDamaged || 0,
  },
  henEggPrice: record.henEggPrice,
  duckEggPrice: record.duckEggPrice,
  totalHenEggs: record.totalHenEggs || 0,
  totalDuckEggs: record.totalDuckEggs || 0,
  totalValue: record.totalValue || 0,
  qualityNotes: record.qualityNotes || undefined,
  paid: !!record.paid,
  paymentDate: record.paymentDate ? new Date(record.paymentDate) : undefined,
  synced: !!record.synced,
});

const mapDbToCollectionRoute = (record: any) => ({
  id: record.id,
  name: record.name,
  description: record.description || undefined,
  farmerIds: (record.customers || []).map((customer: any) => customer.id),
  estimatedTime: record.estimatedTime,
  distance: record.estimatedDistance,
  staffId: record.staffId || undefined,
  schedule: record.schedule,
  active: record.active,
});

export class EggCollectionServiceClass {
  private currentMarketPrices: MarketPrices | null = null;

  async getMarketPrices(): Promise<MarketPrices> {
    if (this.currentMarketPrices && this.isMarketPricesCurrent()) {
      return this.currentMarketPrices;
    }

    const stored = await this.getStoredMarketPrices();
    if (stored) {
      this.currentMarketPrices = stored;
      return stored;
    }

    const fallback = this.getDefaultMarketPrices();
    this.currentMarketPrices = fallback;

    return fallback;
  }

  private isMarketPricesCurrent(): boolean {
    if (!this.currentMarketPrices) return false;
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.currentMarketPrices.lastUpdated > hourAgo;
  }

  private getDefaultMarketPrices(): MarketPrices {
    const baseHenPrice = 2.5;
    const baseDuckPrice = 4.0;
    const variation = (Math.random() - 0.5) * 0.2; // ±10%

    return {
      henEggs: {
        small: baseHenPrice * 0.8 + variation,
        medium: baseHenPrice * 0.9 + variation,
        large: baseHenPrice + variation,
        extraLarge: baseHenPrice * 1.2 + variation,
      },
      duckEggs: {
        small: baseDuckPrice * 0.8 + variation,
        medium: baseDuckPrice + variation,
        large: baseDuckPrice * 1.2 + variation,
      },
      lastUpdated: new Date(),
    };
  }

  private async getStoredMarketPrices(): Promise<MarketPrices | null> {
    const settings = await databaseService.findMany('systemSetting', {
      where: { key: MARKET_PRICES_SETTING_KEY },
      take: 1,
    });
    if (!settings || settings.length === 0) return null;

    try {
      const parsed = JSON.parse(settings[0].value);
      if (!parsed?.henEggs || !parsed?.duckEggs) return null;

      return {
        henEggs: parsed.henEggs,
        duckEggs: parsed.duckEggs,
        lastUpdated: new Date(settings[0].updatedAt || new Date()),
      };
    } catch (error) {
      console.error('Failed to parse stored market prices:', error);
      return null;
    }
  }

  async updateMarketPrices(prices: MarketPrices): Promise<MarketPrices> {
    const payload = {
      henEggs: {
        small: Math.round(prices.henEggs.small),
        medium: Math.round(prices.henEggs.medium),
        large: Math.round(prices.henEggs.large),
        extraLarge: Math.round(prices.henEggs.extraLarge),
      },
      duckEggs: {
        small: Math.round(prices.duckEggs.small),
        medium: Math.round(prices.duckEggs.medium),
        large: Math.round(prices.duckEggs.large),
      },
    };

    const existing = await databaseService.findMany('systemSetting', {
      where: { key: MARKET_PRICES_SETTING_KEY },
      take: 1,
    });

    if (existing && existing.length > 0) {
      await databaseService.update('systemSetting', existing[0].id, {
        value: JSON.stringify(payload),
        type: 'JSON',
      });
    } else {
      await databaseService.create('systemSetting', {
        key: MARKET_PRICES_SETTING_KEY,
        value: JSON.stringify(payload),
        type: 'JSON',
        category: 'financial',
        description: 'Manual market prices for egg collection',
      });
    }

    this.currentMarketPrices = {
      henEggs: payload.henEggs,
      duckEggs: payload.duckEggs,
      lastUpdated: new Date(),
    };

    return this.currentMarketPrices;
  }

  async getCollectionRoutes() {
    const routes = await databaseService.findMany('collectionRoute', {
      orderBy: { name: 'asc' },
      include: { customers: true },
    });
    return (routes as any[]).map(mapDbToCollectionRoute);
  }

  async getEggCollections(query: EggCollectionQuery): Promise<EggCollection[]> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const records = await databaseService.findMany('eggCollection', {
      where: {
        collectionDate: { gte: startDate, lte: endDate },
        ...(query.routeId ? { routeId: query.routeId } : {}),
        ...(query.staffId ? { staffId: query.staffId } : {}),
      },
      orderBy: { collectionDate: 'desc' },
    });

    return (records as any[]).map(mapDbToEggCollection);
  }

  async createEggCollection(
    request: EggCollectionRequest,
  ): Promise<EggCollection> {
    const totalHenEggs = calculateTotalEggs(request.henEggs);
    const totalDuckEggs = calculateTotalEggs(request.duckEggs);

    const totalValue = Math.round(
      (totalHenEggs / 12) * request.henEggPrice +
        (totalDuckEggs / 12) * request.duckEggPrice,
    );

    const collectionDate = request.collectionDate
      ? new Date(request.collectionDate)
      : new Date();

    const record = await databaseService.create('eggCollection', {
      farmerId: request.farmerId,
      routeId: request.routeId || null,
      staffId: request.staffId,
      collectionDate,
      henEggsSmall: request.henEggs.small,
      henEggsMedium: request.henEggs.medium,
      henEggsLarge: request.henEggs.large,
      henEggsExtraLarge: request.henEggs.extraLarge,
      henEggsDamaged: request.henEggs.damaged,
      duckEggsSmall: request.duckEggs.small,
      duckEggsMedium: request.duckEggs.medium,
      duckEggsLarge: request.duckEggs.large,
      duckEggsDamaged: request.duckEggs.damaged,
      totalHenEggs,
      totalDuckEggs,
      henEggPrice: request.henEggPrice,
      duckEggPrice: request.duckEggPrice,
      totalValue,
      qualityNotes: request.qualityNotes || null,
      synced: false,
    });

    const farmer = await databaseService.findById(
      'customer',
      request.farmerId,
    );
    if (farmer) {
      await databaseService.update('customer', request.farmerId, {
        creditBalance: (farmer as any).creditBalance - totalValue,
        totalEggSales: ((farmer as any).totalEggSales || 0) + totalValue,
      });

      const recentCollections = await databaseService.findMany('eggCollection', {
        where: {
          farmerId: request.farmerId,
          collectionDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentCollections.length > 0) {
        const avgHen =
          recentCollections.reduce(
            (sum: number, c: any) => sum + (c.totalHenEggs || 0),
            0,
          ) / recentCollections.length;
        const avgDuck =
          recentCollections.reduce(
            (sum: number, c: any) => sum + (c.totalDuckEggs || 0),
            0,
          ) / recentCollections.length;

        await databaseService.update('customer', request.farmerId, {
          henEggsDailyProduction: Math.round(avgHen),
          duckEggsDailyProduction: Math.round(avgDuck),
        });
      }
    }

    return mapDbToEggCollection(record);
  }

  async updateEggCollection(data: EggCollection): Promise<EggCollection> {
    const totalHenEggs = calculateTotalEggs(data.henEggs);
    const totalDuckEggs = calculateTotalEggs(data.duckEggs);
    const totalValue = Math.round(
      (totalHenEggs / 12) * data.henEggPrice +
        (totalDuckEggs / 12) * data.duckEggPrice,
    );

    const record = await databaseService.update('eggCollection', data.id, {
      farmerId: data.farmerId,
      routeId: data.routeId || null,
      staffId: data.staffId,
      collectionDate: new Date(data.collectionDate),
      henEggsSmall: data.henEggs.small,
      henEggsMedium: data.henEggs.medium,
      henEggsLarge: data.henEggs.large,
      henEggsExtraLarge: data.henEggs.extraLarge,
      henEggsDamaged: data.henEggs.damaged,
      duckEggsSmall: data.duckEggs.small,
      duckEggsMedium: data.duckEggs.medium,
      duckEggsLarge: data.duckEggs.large,
      duckEggsDamaged: data.duckEggs.damaged,
      totalHenEggs,
      totalDuckEggs,
      henEggPrice: data.henEggPrice,
      duckEggPrice: data.duckEggPrice,
      totalValue,
      qualityNotes: data.qualityNotes || null,
    });

    return mapDbToEggCollection(record);
  }

  async markCollectionPaid(id: string): Promise<EggCollection> {
    const record = await databaseService.update('eggCollection', id, {
      paid: true,
      paymentDate: new Date(),
    });
    return mapDbToEggCollection(record);
  }

  async createCollectionRoute(
    data: CollectionRoutePayload,
  ): Promise<CollectionRoutePayload> {
    const record = await databaseService.create('collectionRoute', {
      name: data.name,
      description: data.description || null,
      estimatedTime: data.estimatedTime,
      estimatedDistance: data.distance,
      schedule: data.schedule,
      staffId: data.staffId || null,
      active: data.active,
      customers: {
        connect: data.farmerIds.map((id) => ({ id })),
      },
    });

    const route = await databaseService.findById(
      'collectionRoute',
      (record as any).id,
      { customers: true },
    );

    return mapDbToCollectionRoute(route);
  }

  async updateCollectionRoute(
    data: CollectionRoutePayload,
  ): Promise<CollectionRoutePayload> {
    if (!data.id) {
      throw new Error('Route ID is required');
    }

    await databaseService.update('collectionRoute', data.id, {
      name: data.name,
      description: data.description || null,
      estimatedTime: data.estimatedTime,
      estimatedDistance: data.distance,
      schedule: data.schedule,
      staffId: data.staffId || null,
      active: data.active,
      customers: {
        set: data.farmerIds.map((id) => ({ id })),
      },
    });

    const route = await databaseService.findById('collectionRoute', data.id, {
      customers: true,
    });

    return mapDbToCollectionRoute(route);
  }

  async deleteCollectionRoute(id: string): Promise<void> {
    await databaseService.delete('collectionRoute', id);
  }
}

export const EggCollectionService = new EggCollectionServiceClass();
