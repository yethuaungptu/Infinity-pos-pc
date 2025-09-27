// Egg Collection Service - Handles farm-to-farm egg collection operations
// Includes route optimization, quality tracking, and farmer payments

import {
  EggCollection,
  Customer,
  CollectionRoute,
  Staff,
  Product,
} from '../types/core';
import { databaseService } from './database';
import { notificationService } from './notificationService';

export interface EggCollectionRequest {
  farmerId: string;
  routeId?: string;
  staffId: string;
  collectionDate?: Date;
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

export interface CollectionSummary {
  totalCollections: number;
  totalHenEggs: number;
  totalDuckEggs: number;
  totalValue: number;
  averageQuality: number;
  farmsVisited: number;
  routeEfficiency: number;
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

export class EggCollectionService {
  private currentMarketPrices: MarketPrices | null = null;

  // Record new egg collection
  async recordCollection(
    collectionRequest: EggCollectionRequest,
  ): Promise<EggCollection> {
    try {
      // Validate collection request
      await this.validateCollectionRequest(collectionRequest);

      // Calculate totals
      const totalHenEggs = this.calculateTotalEggs(collectionRequest.henEggs);
      const totalDuckEggs = this.calculateTotalEggs(collectionRequest.duckEggs);

      // Calculate value based on dozens
      const henDozens = totalHenEggs / 12;
      const duckDozens = totalDuckEggs / 12;
      const totalValue =
        henDozens * collectionRequest.henEggPrice +
        duckDozens * collectionRequest.duckEggPrice;

      // Create collection record
      const collection = await databaseService.createEggCollection({
        farmerId: collectionRequest.farmerId,
        collectionDate: collectionRequest.collectionDate || new Date(),
        routeId: collectionRequest.routeId,
        staffId: collectionRequest.staffId,
        henEggs: collectionRequest.henEggs,
        duckEggs: collectionRequest.duckEggs,
        henEggPrice: collectionRequest.henEggPrice,
        duckEggPrice: collectionRequest.duckEggPrice,
        totalHenEggs,
        totalDuckEggs,
        totalValue,
        qualityNotes: collectionRequest.qualityNotes,
        synced: false,
      });

      // Update farmer's production statistics
      await this.updateFarmerStats(collectionRequest.farmerId, collection);

      // Check for quality issues and send alerts
      await this.checkQualityAlerts(collection);

      // Update route performance metrics
      if (collectionRequest.routeId) {
        await this.updateRouteMetrics(collectionRequest.routeId, collection);
      }

      // Update staff performance
      await this.updateCollectorPerformance(
        collectionRequest.staffId,
        collection,
      );

      console.log(
        `Egg collection recorded: ${collection.id} - Value: $${totalValue.toFixed(2)}`,
      );
      return collection;
    } catch (error: any) {
      console.error('Failed to record egg collection:', error);
      throw new Error(`Egg collection recording failed: ${error.message}`);
    }
  }

  // Validate collection request
  private async validateCollectionRequest(
    request: EggCollectionRequest,
  ): Promise<void> {
    // Validate farmer
    const farmer = await databaseService.findById<Customer>(
      'customers',
      request.farmerId,
    );
    if (!farmer || farmer.type !== 'farmer') {
      throw new Error('Invalid farmer ID');
    }

    if (!farmer.active) {
      throw new Error('Farmer account is inactive');
    }

    // Validate staff
    const staff = await databaseService.findById<Staff>(
      'staff',
      request.staffId,
    );
    if (!staff || !staff.permissions.includes('egg_collection')) {
      throw new Error('Staff member not authorized for egg collection');
    }

    // Validate route if provided
    if (request.routeId) {
      const route = await databaseService.findById<CollectionRoute>(
        'collection_routes',
        request.routeId,
      );
      if (!route || !route.active) {
        throw new Error('Invalid collection route');
      }

      if (!route.farmerIds.includes(request.farmerId)) {
        throw new Error('Farmer not assigned to this route');
      }
    }

    // Validate egg quantities (must have some eggs)
    const totalEggs =
      this.calculateTotalEggs(request.henEggs) +
      this.calculateTotalEggs(request.duckEggs);
    if (totalEggs <= 0) {
      throw new Error('Collection must include at least one egg');
    }

    // Validate prices
    if (request.henEggPrice <= 0 || request.duckEggPrice <= 0) {
      throw new Error('Invalid egg prices');
    }

    // Check for reasonable quantities (basic validation)
    const farmerProduction = farmer.eggProduction;
    if (farmerProduction) {
      const expectedHenEggs = farmerProduction.henEggs || 0;
      const expectedDuckEggs = farmerProduction.duckEggs || 0;

      if (this.calculateTotalEggs(request.henEggs) > expectedHenEggs * 1.5) {
        console.warn(
          `Hen egg collection (${this.calculateTotalEggs(request.henEggs)}) exceeds expected production (${expectedHenEggs})`,
        );
      }

      if (this.calculateTotalEggs(request.duckEggs) > expectedDuckEggs * 1.5) {
        console.warn(
          `Duck egg collection (${this.calculateTotalEggs(request.duckEggs)}) exceeds expected production (${expectedDuckEggs})`,
        );
      }
    }
  }

  // Calculate total eggs from breakdown
  private calculateTotalEggs(eggBreakdown: { [key: string]: number }): number {
    return Object.values(eggBreakdown).reduce((sum, count) => sum + count, 0);
  }

  // Update farmer production statistics
  private async updateFarmerStats(
    farmerId: string,
    collection: EggCollection,
  ): Promise<void> {
    try {
      const farmer = await databaseService.findById<Customer>(
        'customers',
        farmerId,
      );
      if (!farmer) return;

      // Get recent collections to calculate averages
      const recentCollections = await this.getFarmerCollections(farmerId, 30); // Last 30 days

      const totalHenEggs = recentCollections.reduce(
        (sum, c) => sum + c.totalHenEggs,
        0,
      );
      const totalDuckEggs = recentCollections.reduce(
        (sum, c) => sum + c.totalDuckEggs,
        0,
      );
      const totalValue = recentCollections.reduce(
        (sum, c) => sum + c.totalValue,
        0,
      );

      // Update farmer record with latest stats
      await databaseService.update<Customer>('customers', farmerId, {
        eggProduction: {
          ...farmer.eggProduction,
          henEggs: Math.round(totalHenEggs / recentCollections.length) || 0,
          duckEggs: Math.round(totalDuckEggs / recentCollections.length) || 0,
        },
        totalEggSales: (farmer.totalEggSales || 0) + collection.totalValue,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to update farmer stats:', error);
    }
  }

  // Check for quality issues and send alerts
  private async checkQualityAlerts(collection: EggCollection): Promise<void> {
    try {
      const totalHenEggs = collection.totalHenEggs;
      const totalDuckEggs = collection.totalDuckEggs;
      const henDamageRate = collection.henEggs.damaged / totalHenEggs;
      const duckDamageRate = collection.duckEggs.damaged / totalDuckEggs;

      // Alert if damage rate is high
      if (henDamageRate > 0.1 || duckDamageRate > 0.1) {
        // More than 10% damage
        await notificationService.sendQualityAlert({
          farmerId: collection.farmerId,
          collectionId: collection.id,
          damageRate: Math.max(henDamageRate, duckDamageRate),
          notes: collection.qualityNotes,
        });
      }

      // Alert if production is significantly lower than expected
      const farmer = await databaseService.findById<Customer>(
        'customers',
        collection.farmerId,
      );
      if (farmer?.eggProduction) {
        const expectedHen = farmer.eggProduction.henEggs;
        const expectedDuck = farmer.eggProduction.duckEggs;

        if (
          totalHenEggs < expectedHen * 0.5 ||
          totalDuckEggs < expectedDuck * 0.5
        ) {
          await notificationService.sendProductionAlert({
            farmerId: collection.farmerId,
            expected: { hen: expectedHen, duck: expectedDuck },
            actual: { hen: totalHenEggs, duck: totalDuckEggs },
          });
        }
      }
    } catch (error) {
      console.error('Failed to check quality alerts:', error);
    }
  }

  // Update route performance metrics
  private async updateRouteMetrics(
    routeId: string,
    collection: EggCollection,
  ): Promise<void> {
    try {
      const route = await databaseService.findById<CollectionRoute>(
        'collection_routes',
        routeId,
      );
      if (!route) return;

      // Calculate route performance (this would be more complex in reality)
      const todaysCollections = await this.getRouteCollections(
        routeId,
        new Date(),
      );
      const totalValue = todaysCollections.reduce(
        (sum, c) => sum + c.totalValue,
        0,
      );

      // Update route statistics (stored in route record or separate metrics table)
      console.log(
        `Route ${route.name} performance - Collections: ${todaysCollections.length}, Value: $${totalValue}`,
      );
    } catch (error) {
      console.error('Failed to update route metrics:', error);
    }
  }

  // Update collector performance
  private async updateCollectorPerformance(
    staffId: string,
    collection: EggCollection,
  ): Promise<void> {
    try {
      const staff = await databaseService.findById<Staff>('staff', staffId);
      if (!staff) return;

      // Get collector's recent performance
      const recentCollections = await this.getStaffCollections(staffId, 30); // Last 30 days

      const totalCollections = recentCollections.length;
      const totalValue = recentCollections.reduce(
        (sum, c) => sum + c.totalValue,
        0,
      );
      const averageQuality = this.calculateAverageQuality(recentCollections);

      // Update staff performance metrics
      await databaseService.update<Staff>('staff', staffId, {
        performanceMetrics: {
          totalCollections: totalCollections,
          averageQuality: averageQuality,
          onTimeRate: 95, // Would be calculated based on route timing
        },
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to update collector performance:', error);
    }
  }

  // Calculate average quality score from collections
  private calculateAverageQuality(collections: EggCollection[]): number {
    if (collections.length === 0) return 0;

    const scores = collections.map((c) => {
      const totalEggs = c.totalHenEggs + c.totalDuckEggs;
      const damagedEggs = c.henEggs.damaged + c.duckEggs.damaged;
      const damageRate = totalEggs > 0 ? damagedEggs / totalEggs : 0;

      // Score from 1-5 based on damage rate
      if (damageRate <= 0.02) return 5; // Less than 2% damage
      if (damageRate <= 0.05) return 4; // Less than 5% damage
      if (damageRate <= 0.1) return 3; // Less than 10% damage
      if (damageRate <= 0.2) return 2; // Less than 20% damage
      return 1; // More than 20% damage
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Get farmer's collections for a period
  async getFarmerCollections(
    farmerId: string,
    days: number,
  ): Promise<EggCollection[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await databaseService.findMany<EggCollection>('egg_collections', {
      where: {
        farmerId,
        collectionDate: { gte: startDate },
      },
      orderBy: { collectionDate: 'desc' },
    });
  }

  // Get route collections for a specific date
  async getRouteCollections(
    routeId: string,
    date: Date,
  ): Promise<EggCollection[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await databaseService.findMany<EggCollection>('egg_collections', {
      where: {
        routeId,
        collectionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { collectionDate: 'asc' },
    });
  }

  // Get staff collections for a period
  async getStaffCollections(
    staffId: string,
    days: number,
  ): Promise<EggCollection[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await databaseService.findMany<EggCollection>('egg_collections', {
      where: {
        staffId,
        collectionDate: { gte: startDate },
      },
      orderBy: { collectionDate: 'desc' },
    });
  }

  // Get collection summary for a period
  async getCollectionSummary(
    startDate: Date,
    endDate: Date,
    routeId?: string,
  ): Promise<CollectionSummary> {
    try {
      const collections = await databaseService.findMany<EggCollection>(
        'egg_collections',
        {
          where: {
            collectionDate: {
              gte: startDate,
              lte: endDate,
            },
            ...(routeId && { routeId }),
          },
        },
      );

      const uniqueFarms = new Set(collections.map((c) => c.farmerId));
      const totalValue = collections.reduce((sum, c) => sum + c.totalValue, 0);
      const totalHenEggs = collections.reduce(
        (sum, c) => sum + c.totalHenEggs,
        0,
      );
      const totalDuckEggs = collections.reduce(
        (sum, c) => sum + c.totalDuckEggs,
        0,
      );

      const averageQuality = this.calculateAverageQuality(collections);

      // Calculate route efficiency (simplified)
      const routeEfficiency = collections.length > 0 ? 85 : 0; // Mock calculation

      return {
        totalCollections: collections.length,
        totalHenEggs,
        totalDuckEggs,
        totalValue,
        averageQuality,
        farmsVisited: uniqueFarms.size,
        routeEfficiency,
      };
    } catch (error) {
      console.error('Failed to get collection summary:', error);
      throw new Error('Failed to calculate collection summary');
    }
  }

  // Get current market prices
  async getMarketPrices(): Promise<MarketPrices> {
    if (this.currentMarketPrices && this.isMarketPricesCurrent()) {
      return this.currentMarketPrices;
    }

    try {
      // In a real system, this would fetch from an external API or database
      // For now, return mock prices with some variation
      const baseHenPrice = 2.5;
      const baseDuckPrice = 4.0;
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation

      this.currentMarketPrices = {
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

      return this.currentMarketPrices;
    } catch (error) {
      console.error('Failed to get market prices:', error);

      // Return fallback prices
      return {
        henEggs: {
          small: 2.0,
          medium: 2.25,
          large: 2.5,
          extraLarge: 3.0,
        },
        duckEggs: {
          small: 3.2,
          medium: 4.0,
          large: 4.8,
        },
        lastUpdated: new Date(),
      };
    }
  }

  // Check if market prices are current (less than 1 hour old)
  private isMarketPricesCurrent(): boolean {
    if (!this.currentMarketPrices) return false;

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.currentMarketPrices.lastUpdated > hourAgo;
  }

  // Optimize collection route
  async optimizeRoute(routeId: string): Promise<{
    optimizedOrder: string[];
    estimatedTime: number;
    estimatedDistance: number;
    suggestions: string[];
  }> {
    try {
      const route = await databaseService.findById<CollectionRoute>(
        'collection_routes',
        routeId,
      );
      if (!route) {
        throw new Error('Route not found');
      }

      // Get farmer locations and production data
      const farmers = await Promise.all(
        route.farmerIds.map((id) =>
          databaseService.findById<Customer>('customers', id),
        ),
      );

      const validFarmers = farmers.filter((f) => f && f.active);

      // Simple optimization - prioritize by production volume and location
      // In a real system, this would use proper routing algorithms
      const optimizedOrder = validFarmers
        .sort((a, b) => {
          // Prioritize high-production farms first
          const aProduction =
            (a!.eggProduction?.henEggs || 0) +
            (a!.eggProduction?.duckEggs || 0);
          const bProduction =
            (b!.eggProduction?.henEggs || 0) +
            (b!.eggProduction?.duckEggs || 0);
          return bProduction - aProduction;
        })
        .map((f) => f!.id);

      // Calculate estimated metrics
      const estimatedTime = optimizedOrder.length * 20; // 20 minutes per farm
      const estimatedDistance = optimizedOrder.length * 3; // 3 km per farm

      const suggestions = [
        'Visit high-production farms first to maximize collection efficiency',
        'Check weather conditions before starting route',
        'Ensure sufficient egg collection containers',
      ];

      // Add specific suggestions based on route analysis
      if (optimizedOrder.length > 8) {
        suggestions.push(
          'Consider splitting route - more than 8 farms may be too many for one trip',
        );
      }

      return {
        optimizedOrder,
        estimatedTime,
        estimatedDistance,
        suggestions,
      };
    } catch (error) {
      console.error('Failed to optimize route:', error);
      throw new Error('Route optimization failed');
    }
  }

  // Get daily collection report
  async getDailyCollectionReport(date: Date): Promise<{
    summary: CollectionSummary;
    collections: EggCollection[];
    topFarms: Array<{
      farmerId: string;
      farmerName: string;
      totalValue: number;
      totalEggs: number;
    }>;
    qualityIssues: Array<{
      collectionId: string;
      farmerId: string;
      issue: string;
    }>;
    routePerformance: Array<{
      routeId: string;
      routeName: string;
      collections: number;
      efficiency: number;
    }>;
  }> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all collections for the day
      const collections = await databaseService.findMany<EggCollection>(
        'egg_collections',
        {
          where: {
            collectionDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            farmer: true,
            route: true,
          },
        },
      );

      // Calculate summary
      const summary = await this.getCollectionSummary(startOfDay, endOfDay);

      // Get top farms by value
      const farmStats = new Map<
        string,
        { name: string; totalValue: number; totalEggs: number }
      >();
      const qualityIssues: Array<{
        collectionId: string;
        farmerId: string;
        issue: string;
      }> = [];
      const routeStats = new Map<
        string,
        { name: string; collections: number }
      >();

      for (const collection of collections) {
        // Farm statistics
        const farmId = collection.farmerId;
        const existing = farmStats.get(farmId);
        const totalEggs = collection.totalHenEggs + collection.totalDuckEggs;

        if (existing) {
          existing.totalValue += collection.totalValue;
          existing.totalEggs += totalEggs;
        } else {
          // In a real system, farmer name would come from included data
          farmStats.set(farmId, {
            name: `Farm ${farmId}`, // Would be actual farmer name
            totalValue: collection.totalValue,
            totalEggs: totalEggs,
          });
        }

        // Quality issues
        const henDamageRate =
          collection.henEggs.damaged / collection.totalHenEggs;
        const duckDamageRate =
          collection.duckEggs.damaged / collection.totalDuckEggs;

        if (henDamageRate > 0.1 || duckDamageRate > 0.1) {
          qualityIssues.push({
            collectionId: collection.id,
            farmerId: collection.farmerId,
            issue: `High damage rate: ${Math.max(henDamageRate, duckDamageRate) * 100}%`,
          });
        }

        // Route performance
        if (collection.routeId) {
          const routeData = routeStats.get(collection.routeId);
          if (routeData) {
            routeData.collections++;
          } else {
            routeStats.set(collection.routeId, {
              name: `Route ${collection.routeId}`, // Would be actual route name
              collections: 1,
            });
          }
        }
      }

      // Convert to arrays and sort
      const topFarms = Array.from(farmStats.entries())
        .map(([farmerId, stats]) => ({
          farmerId,
          farmerName: stats.name,
          totalValue: stats.totalValue,
          totalEggs: stats.totalEggs,
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      const routePerformance = Array.from(routeStats.entries()).map(
        ([routeId, stats]) => ({
          routeId,
          routeName: stats.name,
          collections: stats.collections,
          efficiency: 85, // Mock efficiency calculation
        }),
      );

      return {
        summary,
        collections,
        topFarms,
        qualityIssues,
        routePerformance,
      };
    } catch (error) {
      console.error('Failed to get daily collection report:', error);
      throw new Error('Daily collection report generation failed');
    }
  }

  // Process batch payment for egg collections
  async processBatchPayment(
    collectionIds: string[],
    paymentMethod: string = 'bank_transfer',
    staffId: string,
  ): Promise<{
    processed: number;
    totalAmount: number;
    failures: Array<{ collectionId: string; error: string }>;
  }> {
    const failures: Array<{ collectionId: string; error: string }> = [];
    let processed = 0;
    let totalAmount = 0;

    try {
      for (const collectionId of collectionIds) {
        try {
          const collection = await databaseService.findById<EggCollection>(
            'egg_collections',
            collectionId,
          );
          if (!collection) {
            failures.push({ collectionId, error: 'Collection not found' });
            continue;
          }

          // Create payment record
          await databaseService.create('payment_records', {
            type: 'customer_payment',
            customerId: collection.farmerId,
            amount: collection.totalValue,
            paymentMethod,
            staffId,
            paymentDate: new Date(),
            notes: `Payment for egg collection ${collection.id}`,
          });

          // Update collection as paid
          await databaseService.update('egg_collections', collectionId, {
            paid: true,
            paymentDate: new Date(),
          });

          processed++;
          totalAmount += collection.totalValue;
        } catch (error: any) {
          failures.push({ collectionId, error: error.message });
        }
      }

      console.log(
        `Batch payment processed: ${processed} collections, ${totalAmount.toFixed(2)}`,
      );

      return {
        processed,
        totalAmount,
        failures,
      };
    } catch (error) {
      console.error('Batch payment processing failed:', error);
      throw new Error('Batch payment processing failed');
    }
  }

  // Get unpaid collections for a farmer
  async getUnpaidCollections(farmerId: string): Promise<EggCollection[]> {
    return await databaseService.findMany<EggCollection>('egg_collections', {
      where: {
        farmerId,
        paid: false,
      },
      orderBy: { collectionDate: 'desc' },
    });
  }

  // Export collection data to CSV
  async exportCollectionData(
    startDate: Date,
    endDate: Date,
    routeId?: string,
  ): Promise<string> {
    try {
      const collections = await databaseService.findMany<EggCollection>(
        'egg_collections',
        {
          where: {
            collectionDate: {
              gte: startDate,
              lte: endDate,
            },
            ...(routeId && { routeId }),
          },
          include: {
            farmer: true,
            route: true,
            staff: true,
          },
        },
      );

      // Generate CSV content
      const headers = [
        'Collection Date',
        'Farmer ID',
        'Farmer Name',
        'Route',
        'Collector',
        'Hen Eggs Small',
        'Hen Eggs Medium',
        'Hen Eggs Large',
        'Hen Eggs XL',
        'Hen Eggs Damaged',
        'Total Hen Eggs',
        'Duck Eggs Small',
        'Duck Eggs Medium',
        'Duck Eggs Large',
        'Duck Eggs Damaged',
        'Total Duck Eggs',
        'Hen Price/Dozen',
        'Duck Price/Dozen',
        'Total Value',
        'Quality Notes',
        'Paid Status',
      ];

      const rows = collections.map((c) => [
        c.collectionDate.toLocaleDateString(),
        c.farmerId,
        `Farmer ${c.farmerId}`, // Would be actual farmer name from included data
        c.routeId || 'Direct',
        c.staffId,
        c.henEggs.small,
        c.henEggs.medium,
        c.henEggs.large,
        c.henEggs.extraLarge,
        c.henEggs.damaged,
        c.totalHenEggs,
        c.duckEggs.small,
        c.duckEggs.medium,
        c.duckEggs.large,
        c.duckEggs.damaged,
        c.totalDuckEggs,
        c.henEggPrice.toFixed(2),
        c.duckEggPrice.toFixed(2),
        c.totalValue.toFixed(2),
        c.qualityNotes || '',
        (c as any).paid ? 'Paid' : 'Unpaid',
      ]);

      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) =>
              typeof cell === 'string' && cell.includes(',')
                ? `"${cell}"`
                : cell,
            )
            .join(','),
        ),
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Failed to export collection data:', error);
      throw new Error('Collection data export failed');
    }
  }

  // Validate collection data before processing
  async validateCollectionData(
    collectionRequest: EggCollectionRequest,
  ): Promise<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Validate farmer exists and is active
      const farmer = await databaseService.findById<Customer>(
        'customers',
        collectionRequest.farmerId,
      );
      if (!farmer) {
        errors.push('Farmer not found');
      } else if (!farmer.active) {
        errors.push('Farmer account is inactive');
      } else if (farmer.type !== 'farmer') {
        errors.push('Customer is not a farmer');
      }

      // Validate staff permissions
      const staff = await databaseService.findById<Staff>(
        'staff',
        collectionRequest.staffId,
      );
      if (!staff) {
        errors.push('Staff member not found');
      } else if (!staff.permissions.includes('egg_collection')) {
        errors.push('Staff member not authorized for egg collection');
      }

      // Check for reasonable quantities
      const totalEggs =
        this.calculateTotalEggs(collectionRequest.henEggs) +
        this.calculateTotalEggs(collectionRequest.duckEggs);

      if (totalEggs === 0) {
        errors.push('No eggs recorded in collection');
      }

      if (totalEggs > 1000) {
        warnings.push('Very large collection - please verify quantities');
      }

      // Check damage rates
      const henDamageRate =
        collectionRequest.henEggs.damaged /
        this.calculateTotalEggs(collectionRequest.henEggs);
      const duckDamageRate =
        collectionRequest.duckEggs.damaged /
        this.calculateTotalEggs(collectionRequest.duckEggs);

      if (henDamageRate > 0.2 || duckDamageRate > 0.2) {
        warnings.push(
          'High damage rate detected - consider quality investigation',
        );
      }

      // Check pricing against market rates
      const marketPrices = await this.getMarketPrices();

      if (collectionRequest.henEggPrice < marketPrices.henEggs.large * 0.5) {
        warnings.push('Hen egg price is significantly below market rate');
      }

      if (collectionRequest.duckEggPrice < marketPrices.duckEggs.large * 0.5) {
        warnings.push('Duck egg price is significantly below market rate');
      }

      // Check for duplicate collection today
      if (farmer) {
        const todaysCollections = await this.getFarmerCollections(farmer.id, 1);
        if (todaysCollections.length > 0) {
          warnings.push('Farmer already has a collection recorded today');
        }
      }

      return {
        isValid: errors.length === 0,
        warnings,
        errors,
      };
    } catch (error) {
      console.error('Validation failed:', error);
      return {
        isValid: false,
        warnings,
        errors: [...errors, 'Validation process failed'],
      };
    }
  }
}

// Export singleton instance
export const eggCollectionService = new EggCollectionService();
