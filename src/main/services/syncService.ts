// Offline-first Sync Service (Main process)
// Push local changes to cloud and pull cloud updates

import { databaseService } from '../database.js';
import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as CloudPrismaClient } from '../../generated/prisma-cloud';

const SYNC_LAST_PUSH_KEY = 'SYNC_LAST_PUSH';
const SYNC_LAST_PULL_KEY = 'SYNC_LAST_PULL';

const toDate = (value?: string | null) =>
  value ? new Date(value) : new Date(0);
const omitId = <T extends { id?: any }>(record: T) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...data } = record;
  return data;
};
const omitTransactionItem = <T extends { transactionId?: any }>(record: T) => {
  const { transactionId, ...data } = record;
  return data;
};

export class SyncServiceClass {
  private syncInterval: NodeJS.Timeout | null = null;
  private cloudClient: any | null = null;

  private async logSync(
    success: boolean,
    error?: string,
    operation: 'BULK_SYNC' | 'CREATE' | 'UPDATE' | 'DELETE' = 'BULK_SYNC',
    tableName = 'all',
    recordId = 'sync',
  ) {
    try {
      await databaseService.create('syncLog', {
        tableName,
        recordId,
        operation,
        success,
        error: error || null,
      });
    } catch (logError) {
      console.warn('[sync] Failed to write sync log:', logError);
    }
  }

  private async getSetting(key: string): Promise<string | null> {
    const settings = await databaseService.findMany('systemSetting', {
      where: { key },
      take: 1,
    });
    if (!settings || settings.length === 0) return null;
    return settings[0].value;
  }

  private async setSetting(key: string, value: string) {
    const existing = await databaseService.findMany('systemSetting', {
      where: { key },
      take: 1,
    });
    if (existing && existing.length > 0) {
      await databaseService.update('systemSetting', existing[0].id, {
        value,
        type: 'STRING',
        category: 'sync',
      });
    } else {
      await databaseService.create('systemSetting', {
        key,
        value,
        type: 'STRING',
        category: 'sync',
        description: 'Sync metadata',
      });
    }
  }

  private async ensureCloudClient() {
    if (this.cloudClient) return this.cloudClient;

    const url = process.env.DATABASE_URL_CLOUD;
    if (!url) {
      console.warn('[sync] DATABASE_URL_CLOUD not set in .env');
      return null;
    }

    try {
      const pool = new pg.Pool({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
      });
      const adapter = new PrismaPg(pool);
      this.cloudClient = new CloudPrismaClient({ adapter });
      console.log('[sync] Cloud client created');
      return this.cloudClient;
    } catch (error) {
      console.error('[sync] Failed to create cloud client:', error);
      return null;
    }
  }

  private async isOnline(): Promise<boolean> {
    try {
      const client = await this.ensureCloudClient();
      console.log('[sync] Checking cloud connectivity...', client);
      if (!client) return false;
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Cloud connection check failed:', error);
      return false;
    }
  }

  start(intervalMinutes = 5) {
    if (this.syncInterval) return;
    this.syncInterval = setInterval(
      () => this.syncNow(),
      intervalMinutes * 60 * 1000,
    );
    this.syncNow();
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncNow() {
    const online = await this.isOnline();
    console.log(`[sync] Sync triggered. Online status: ${online}`);
    if (!online) {
      console.log('[sync] Offline or cloud unreachable. Skipping sync.');
      await this.logSync(false, 'Offline or cloud unreachable');
      return;
    }

    try {
      console.log('[sync] Starting sync...');
      await this.pushLocalChanges();
      await this.pullCloudChanges();
      console.log('[sync] Sync completed.');
      await this.logSync(true);
    } catch (error) {
      console.error('[sync] Sync failed:', error);
      await this.logSync(
        false,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async pushLocalChanges() {
    const cloud = await this.ensureCloudClient();
    if (!cloud) {
      console.log('[sync] Cloud client not ready. Skipping push.');
      return;
    }

    const lastPush = toDate(await this.getSetting(SYNC_LAST_PUSH_KEY));
    const local = databaseService.getLocalClient();
    console.log(
      `[sync] Push: lastPush=${lastPush.toISOString()} (local changes after this will be uploaded)`,
    );

    const customers = await local.customer.findMany({
      where: { updatedAt: { gt: lastPush } },
    });
    console.log(`[sync] Push customers: ${customers.length}`);
    for (const customer of customers) {
      const cloudRecord = await cloud.customer.findUnique({
        where: { id: customer.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > customer.updatedAt) continue;
      await cloud.customer.upsert({
        where: { id: customer.id },
        create: customer,
        update: omitId(customer),
      });
    }

    const vendors = await local.vendor.findMany({
      where: { updatedAt: { gt: lastPush } },
    });
    console.log(`[sync] Push vendors: ${vendors.length}`);
    for (const vendor of vendors) {
      const cloudRecord = await cloud.vendor.findUnique({
        where: { id: vendor.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > vendor.updatedAt) continue;
      await cloud.vendor.upsert({
        where: { id: vendor.id },
        create: vendor,
        update: omitId(vendor),
      });
    }

    const products = await local.product.findMany({
      where: { updatedAt: { gt: lastPush } },
    });
    console.log(`[sync] Push products: ${products.length}`);
    for (const product of products) {
      const cloudRecord = await cloud.product.findUnique({
        where: { id: product.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > product.updatedAt) continue;
      await cloud.product.upsert({
        where: { id: product.id },
        create: product,
        update: omitId(product),
      });
    }

    const staff = await local.staff.findMany({
      where: { updatedAt: { gt: lastPush } },
    });
    console.log(`[sync] Push staff: ${staff.length}`);
    for (const s of staff) {
      const cloudRecord = await cloud.staff.findUnique({
        where: { id: s.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > s.updatedAt) continue;
      await cloud.staff.upsert({
        where: { id: s.id },
        create: s,
        update: omitId(s),
      });
    }

    const routes = await local.collectionRoute.findMany({
      where: { updatedAt: { gt: lastPush } },
    });
    console.log(`[sync] Push collectionRoutes: ${routes.length}`);
    for (const route of routes) {
      const cloudRecord = await cloud.collectionRoute.findUnique({
        where: { id: route.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > route.updatedAt) continue;
      await cloud.collectionRoute.upsert({
        where: { id: route.id },
        create: route,
        update: omitId(route),
      });
    }

    const eggCollections = await local.eggCollection.findMany({
      where: { updatedAt: { gt: lastPush } },
    });
    console.log(`[sync] Push eggCollections: ${eggCollections.length}`);
    for (const collection of eggCollections) {
      const cloudRecord = await cloud.eggCollection.findUnique({
        where: { id: collection.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > collection.updatedAt) continue;
      await cloud.eggCollection.upsert({
        where: { id: collection.id },
        create: collection,
        update: omitId(collection),
      });
    }

    const deliveries = await local.eggDelivery.findMany({
      where: { updatedAt: { gt: lastPush } },
    });
    console.log(`[sync] Push eggDeliveries: ${deliveries.length}`);
    for (const delivery of deliveries) {
      const cloudRecord = await cloud.eggDelivery.findUnique({
        where: { id: delivery.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > delivery.updatedAt) continue;
      await cloud.eggDelivery.upsert({
        where: { id: delivery.id },
        create: delivery,
        update: omitId(delivery),
      });
    }

    const inventory = await local.eggInventory.findMany({
      where: { updatedAt: { gt: lastPush } },
    });
    console.log(`[sync] Push eggInventory: ${inventory.length}`);
    for (const record of inventory) {
      const cloudRecord = await cloud.eggInventory.findUnique({
        where: { id: record.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > record.updatedAt) continue;
      await cloud.eggInventory.upsert({
        where: { id: record.id },
        create: record,
        update: omitId(record),
      });
    }

    const transactions = await local.transaction.findMany({
      where: { updatedAt: { gt: lastPush } },
      include: { items: true },
    });
    console.log(`[sync] Push transactions: ${transactions.length}`);
    for (const transaction of transactions) {
      const { items, ...transactionData } = transaction;
      const cloudRecord = await cloud.transaction.findUnique({
        where: { id: transaction.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > transaction.updatedAt)
        continue;
      await cloud.transaction.upsert({
        where: { id: transaction.id },
        create: {
          ...transactionData,
          items: {
            create: items.map((item: any) => omitTransactionItem(item)),
          },
        },
        update: {
          ...omitId(transactionData),
          items: {
            deleteMany: {},
            create: items.map((item: any) => omitTransactionItem(item)),
          },
        },
      });
    }

    const paymentRecords = await local.paymentRecord.findMany({
      where: { updatedAt: { gt: lastPush } },
    });
    console.log(`[sync] Push paymentRecords: ${paymentRecords.length}`);
    for (const record of paymentRecords) {
      const cloudRecord = await cloud.paymentRecord.findUnique({
        where: { id: record.id },
      });
      if (cloudRecord && cloudRecord.updatedAt > record.updatedAt) continue;
      await cloud.paymentRecord.upsert({
        where: { id: record.id },
        create: record,
        update: omitId(record),
      });
    }

    await this.setSetting(SYNC_LAST_PUSH_KEY, new Date().toISOString());
    console.log('[sync] Push complete. Updated SYNC_LAST_PUSH.');
  }

  private async pullCloudChanges() {
    const cloud = await this.ensureCloudClient();
    if (!cloud) {
      console.log('[sync] Cloud client not ready. Skipping pull.');
      return;
    }

    const lastPull = toDate(await this.getSetting(SYNC_LAST_PULL_KEY));
    const local = databaseService.getLocalClient();
    console.log(
      `[sync] Pull: lastPull=${lastPull.toISOString()} (cloud changes after this will be downloaded)`,
    );

    const cloudCustomers = await cloud.customer.findMany({
      where: { updatedAt: { gt: lastPull } },
    });
    console.log(`[sync] Pull customers: ${cloudCustomers.length}`);
    for (const customer of cloudCustomers) {
      const localRecord = await local.customer.findUnique({
        where: { id: customer.id },
      });
      if (localRecord && localRecord.updatedAt >= customer.updatedAt) continue;
      if (localRecord) {
        await local.customer.update({
          where: { id: customer.id },
          data: omitId(customer),
        });
      } else {
        await local.customer.create({ data: customer });
      }
    }

    const cloudVendors = await cloud.vendor.findMany({
      where: { updatedAt: { gt: lastPull } },
    });
    console.log(`[sync] Pull vendors: ${cloudVendors.length}`);
    for (const vendor of cloudVendors) {
      const localRecord = await local.vendor.findUnique({
        where: { id: vendor.id },
      });
      if (localRecord && localRecord.updatedAt >= vendor.updatedAt) continue;
      if (localRecord) {
        await local.vendor.update({
          where: { id: vendor.id },
          data: omitId(vendor),
        });
      } else {
        await local.vendor.create({ data: vendor });
      }
    }

    const cloudProducts = await cloud.product.findMany({
      where: { updatedAt: { gt: lastPull } },
    });
    console.log(`[sync] Pull products: ${cloudProducts.length}`);
    for (const product of cloudProducts) {
      const localRecord = await local.product.findUnique({
        where: { id: product.id },
      });
      if (localRecord && localRecord.updatedAt >= product.updatedAt) continue;
      if (localRecord) {
        await local.product.update({
          where: { id: product.id },
          data: omitId(product),
        });
      } else {
        await local.product.create({ data: product });
      }
    }

    const cloudStaff = await cloud.staff.findMany({
      where: { updatedAt: { gt: lastPull } },
    });
    console.log(`[sync] Pull staff: ${cloudStaff.length}`);
    for (const s of cloudStaff) {
      const localRecord = await local.staff.findUnique({
        where: { id: s.id },
      });
      if (localRecord && localRecord.updatedAt >= s.updatedAt) continue;
      if (localRecord) {
        await local.staff.update({
          where: { id: s.id },
          data: omitId(s),
        });
      } else {
        await local.staff.create({ data: s });
      }
    }

    const cloudRoutes = await cloud.collectionRoute.findMany({
      where: { updatedAt: { gt: lastPull } },
    });
    console.log(`[sync] Pull collectionRoutes: ${cloudRoutes.length}`);
    for (const route of cloudRoutes) {
      const localRecord = await local.collectionRoute.findUnique({
        where: { id: route.id },
      });
      if (localRecord && localRecord.updatedAt >= route.updatedAt) continue;
      if (localRecord) {
        await local.collectionRoute.update({
          where: { id: route.id },
          data: omitId(route),
        });
      } else {
        await local.collectionRoute.create({ data: route });
      }
    }

    const cloudCollections = await cloud.eggCollection.findMany({
      where: { updatedAt: { gt: lastPull } },
    });
    console.log(`[sync] Pull eggCollections: ${cloudCollections.length}`);
    for (const collection of cloudCollections) {
      const localRecord = await local.eggCollection.findUnique({
        where: { id: collection.id },
      });
      if (localRecord && localRecord.updatedAt >= collection.updatedAt)
        continue;
      if (localRecord) {
        await local.eggCollection.update({
          where: { id: collection.id },
          data: omitId(collection),
        });
      } else {
        await local.eggCollection.create({ data: collection });
      }
    }

    const cloudDeliveries = await cloud.eggDelivery.findMany({
      where: { updatedAt: { gt: lastPull } },
    });
    console.log(`[sync] Pull eggDeliveries: ${cloudDeliveries.length}`);
    for (const delivery of cloudDeliveries) {
      const localRecord = await local.eggDelivery.findUnique({
        where: { id: delivery.id },
      });
      if (localRecord && localRecord.updatedAt >= delivery.updatedAt) continue;
      if (localRecord) {
        await local.eggDelivery.update({
          where: { id: delivery.id },
          data: omitId(delivery),
        });
      } else {
        await local.eggDelivery.create({ data: delivery });
      }
    }

    const cloudInventory = await cloud.eggInventory.findMany({
      where: { updatedAt: { gt: lastPull } },
    });
    console.log(`[sync] Pull eggInventory: ${cloudInventory.length}`);
    for (const record of cloudInventory) {
      const localRecord = await local.eggInventory.findUnique({
        where: { id: record.id },
      });
      if (localRecord && localRecord.updatedAt >= record.updatedAt) continue;
      if (localRecord) {
        await local.eggInventory.update({
          where: { id: record.id },
          data: omitId(record),
        });
      } else {
        await local.eggInventory.create({ data: record });
      }
    }

    const cloudTransactions = await cloud.transaction.findMany({
      where: { updatedAt: { gt: lastPull } },
      include: { items: true },
    });
    console.log(`[sync] Pull transactions: ${cloudTransactions.length}`);
    for (const transaction of cloudTransactions) {
      const { items, ...transactionData } = transaction;
      const localRecord = await local.transaction.findUnique({
        where: { id: transaction.id },
      });
      if (localRecord && localRecord.updatedAt >= transaction.updatedAt)
        continue;
      if (localRecord) {
        await local.transaction.update({
          where: { id: transaction.id },
          data: {
            ...omitId(transactionData),
            items: {
              deleteMany: {},
              create: items.map((item: any) => omitTransactionItem(item)),
            },
          },
        });
      } else {
        await local.transaction.create({
          data: {
            ...transactionData,
            items: {
              create: items.map((item: any) => omitTransactionItem(item)),
            },
          },
        });
      }
    }

    const cloudPayments = await cloud.paymentRecord.findMany({
      where: { updatedAt: { gt: lastPull } },
    });
    console.log(`[sync] Pull paymentRecords: ${cloudPayments.length}`);
    for (const record of cloudPayments) {
      const localRecord = await local.paymentRecord.findUnique({
        where: { id: record.id },
      });
      if (localRecord && localRecord.updatedAt >= record.updatedAt) continue;
      if (localRecord) {
        await local.paymentRecord.update({
          where: { id: record.id },
          data: omitId(record),
        });
      } else {
        await local.paymentRecord.create({ data: record });
      }
    }

    await this.setSetting(SYNC_LAST_PULL_KEY, new Date().toISOString());
    // Prevent pushing pulled changes in the next cycle
    await this.setSetting(SYNC_LAST_PUSH_KEY, new Date().toISOString());
    console.log('[sync] Pull complete. Updated SYNC_LAST_PULL.');
  }

  async getSyncLogs(limit = 50) {
    return databaseService.findMany('syncLog', {
      orderBy: { syncedAt: 'desc' },
      take: limit,
    });
  }

  async clearSyncLogs() {
    await databaseService.deleteMany('syncLog');
    console.log('[sync] Sync logs cleared');
  }

  async restoreAllFromCloud() {
    const cloud = await this.ensureCloudClient();
    if (!cloud) throw new Error('Cloud client not available');
    const local = databaseService.getLocalClient();

    const models = ['store', 'staff', 'customer', 'vendor', 'product', 'collectionRoute', 'eggCollection', 'eggDelivery', 'eggInventory', 'transaction', 'paymentRecord', 'systemSetting'] as const;

    for (const model of models) {
      try {
        const records = await (cloud[model] as any).findMany(model === 'transaction' ? { include: { items: true } } : undefined);
        console.log(`[restore] ${model}: ${records.length} records`);
        for (const record of records) {
          const { items, ...data } = record;
          await (local[model] as any).upsert({
            where: { id: data.id },
            create: model === 'transaction' && items ? { ...data, items: { create: items.map((i: any) => omitTransactionItem(i)) } } : data,
            update: model === 'transaction' && items ? { ...omitId(data), items: { deleteMany: {}, create: items.map((i: any) => omitTransactionItem(i)) } } : omitId(data),
          });
        }
      } catch (err) {
        console.warn(`[restore] Failed to restore ${model}:`, err);
      }
    }

    console.log('[restore] Restore from cloud complete.');
  }
}

export const SyncService = new SyncServiceClass();
