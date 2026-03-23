// Offline-first Sync Service (Main process)
// Push local changes to cloud and pull cloud updates

import { databaseService } from '../database';
import path from 'path';

const SYNC_LAST_PUSH_KEY = 'SYNC_LAST_PUSH';
const SYNC_LAST_PULL_KEY = 'SYNC_LAST_PULL';

const toDate = (value?: string | null) =>
  value ? new Date(value) : new Date(0);
const omitId = <T extends { id?: any }>(record: T) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...data } = record;
  return data;
};

export class SyncServiceClass {
  private syncInterval: NodeJS.Timeout | null = null;
  private cloudClient: any | null = null;
  private cloudClientConstructor: any | null = null;
  private warnedMissingClient = false;

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
    if (!this.cloudClientConstructor) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
        const module = require(
          path.resolve(
            process.cwd(),
            'src',
            'generated',
            'prisma-cloud',
            'client',
          ),
        );
        this.cloudClientConstructor = module.PrismaClient;
      } catch (error) {
        if (!this.warnedMissingClient) {
          console.warn(
            'Cloud Prisma client not available yet (did you run generate:cloud?).',
          );
          this.warnedMissingClient = true;
        }
        return null;
      }
    }

    const url = process.env.CLOUD_DATABASE_URL;
    if (!url) return null;

    this.cloudClient = new this.cloudClientConstructor({
      datasources: { db: { url } },
    });
    return this.cloudClient;
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
      return;
    }

    try {
      console.log('[sync] Starting sync...');
      await this.pushLocalChanges();
      await this.pullCloudChanges();
      console.log('[sync] Sync completed.');
    } catch (error) {
      console.error('[sync] Sync failed:', error);
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
            create: items.map((item: any) => ({
              ...item,
            })),
          },
        },
        update: {
          ...omitId(transactionData),
          items: {
            deleteMany: {},
            create: items.map((item: any) => ({
              ...item,
            })),
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
              create: items.map((item: any) => ({ ...item })),
            },
          },
        });
      } else {
        await local.transaction.create({
          data: {
            ...transactionData,
            items: {
              create: items.map((item: any) => ({ ...item })),
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
}

export const SyncService = new SyncServiceClass();
