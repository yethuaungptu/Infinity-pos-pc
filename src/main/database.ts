import path from 'path';
import { app } from 'electron';
import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

interface DatabaseConfig {
  isOnline: boolean;
  cloudUrl?: string;
  localDbPath?: string;
}

export class DatabaseService {
  private config: DatabaseConfig;
  private cloudPrisma: PrismaClient | null = null;
  private localPrisma: PrismaClient | null = null;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializeConnections();
  }

  private initializeConnections() {
    console.log('Initializing database connections...########');
    try {
      // Cloud (PostgreSQL)
      if (this.config.isOnline && this.config.cloudUrl) {
        this.cloudPrisma = new PrismaClient({});
        console.log('✅ Cloud DB initialized');
      }
      console.log(PrismaClient);
      // Local (SQLite)
      // const dbPath =
      //   this.config.localDbPath ||
      //   path.join(app.getPath('userData'), 'agripos.db');
      const isDev = !app.isPackaged;
      const dbPath = isDev
        ? path.join(__dirname, '..', '..', 'prisma', 'agripos.db')
        : path.join(app.getPath('userData'), 'agripos.db');
      console.log('Local DB Path:', dbPath);
      this.localPrisma = new PrismaClient();

      console.log('✅ Local DB initialized at:', dbPath);
    } catch (err) {
      console.error('❌ Database initialization failed:', err);
      throw new Error('Failed to initialize databases');
    }
  }

  private getActiveClient(): PrismaClient {
    return this.config.isOnline && this.cloudPrisma
      ? this.cloudPrisma
      : (this.localPrisma as PrismaClient);
  }

  // -------------------
  // Generic Operations
  // -------------------

  async testConnection(): Promise<boolean> {
    try {
      const client = this.getActiveClient();
      await client.$queryRaw`SELECT 1`;
      console.log(
        `${this.config.isOnline ? 'Cloud' : 'Local'} DB connection OK`,
      );
      return true;
    } catch (err) {
      console.error('DB connection failed:', err);
      return false;
    }
  }

  async getAllProducts() {
    const client = this.getActiveClient();
    return client.product.findMany({
      where: { active: true },
    });
  }

  async getTodaySalesSummary() {
    const client = this.getActiveClient();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalSales = await client.transaction.aggregate({
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
    });

    const totalTransactions = await client.transaction.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
    });

    const totalItemsSold = await client.transactionItem.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        transaction: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'COMPLETED',
        },
      },
    });

    return {
      totalSales: totalSales._sum.total || 0,
      totalTransactions,
      totalItemsSold: totalItemsSold._sum.quantity || 0,
    };
  }

  async login(username: any) {
    const client = this.getActiveClient();
    return (client['staff'] as any).findUnique({ where: { username } });
  }

  async create<T extends keyof PrismaClient>(table: T, data: any) {
    const client = this.getActiveClient();
    return (client[table] as any).create({ data });
  }

  async findMany<T extends keyof PrismaClient>(table: T, options?: any) {
    const client = this.getActiveClient();
    return (client[table] as any).findMany(options);
  }

  async findById<T extends keyof PrismaClient>(
    table: T,
    id: string,
    include?: any,
  ) {
    const client = this.getActiveClient();
    return (client[table] as any).findUnique({
      where: { id },
      include,
    });
  }

  async update<T extends keyof PrismaClient>(table: T, id: string, data: any) {
    const client = this.getActiveClient();
    return (client[table] as any).update({
      where: { id },
      data,
    });
  }

  async delete<T extends keyof PrismaClient>(table: T, id: string) {
    const client = this.getActiveClient();
    return (client[table] as any).delete({ where: { id } });
  }

  async disconnect() {
    try {
      if (this.cloudPrisma) await this.cloudPrisma.$disconnect();
      if (this.localPrisma) await this.localPrisma.$disconnect();
      console.log('✅ DB disconnected');
    } catch (err) {
      console.error('❌ Error disconnecting DB:', err);
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService({
  isOnline: false,
  cloudUrl: process.env.CLOUD_DATABASE_URL, // use env var for cloud DB
  localDbPath: '../', // defaults to app.getPath("userData")
});
