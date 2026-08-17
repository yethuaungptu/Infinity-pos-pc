import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { PrismaClient } from '../generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

export class DatabaseService {
  private localPrisma: PrismaClient | null = null;

  constructor() {
    this.initializeConnections();
  }

  private resolveDbPath(): string {
    const isDev = !app.isPackaged;
    if (isDev) {
      return path.join(__dirname, '..', '..', 'prisma', 'agripos.db');
    }
    return path.join(app.getPath('userData'), 'agripos.db');
  }

  private initializeConnections() {
    console.log('Initializing database connections...########');
    try {
      const dbPath = this.resolveDbPath();
      console.log('Local DB Path:', dbPath);

      if (app.isPackaged) {
        this.ensureDatabaseFile(dbPath);
      }

      const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
      this.localPrisma = new PrismaClient({ adapter });

      // After connecting, ensure schema exists (creates tables from schema.sql if missing)
      if (app.isPackaged) {
        this.ensureSchemaSync(dbPath);
      }

      console.log('✅ Local DB initialized at:', dbPath);
    } catch (err) {
      console.error('❌ Database initialization failed:', err);
      throw new Error(`Failed to initialize databases: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private ensureSchemaSync(dbPath: string): void {
    try {
      // Use better-sqlite3 directly to check if tables exist
      const db = new Database(dbPath);
      const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='system_settings'").get();
      if (row) {
        db.close();
        return;
      }

      console.log('⚠ system_settings table not found, creating schema from schema.sql...');
      const schemaPaths = [
        path.join(app.getAppPath(), 'schema.sql'),
        path.join(app.getAppPath(), 'dist', 'schema.sql'),
        path.join(process.resourcesPath, 'schema.sql'),
        path.join(process.resourcesPath, 'assets', 'schema.sql'),
      ];

      for (const sqlPath of schemaPaths) {
        if (fs.existsSync(sqlPath)) {
          console.log('  Found schema.sql at:', sqlPath);
          const sql = fs.readFileSync(sqlPath, 'utf-8');
          db.exec(sql);
          console.log('✅ Tables created successfully from schema.sql');
          db.close();
          return;
        }
      }

      console.warn('⚠ schema.sql not found at any location');
      for (const p of schemaPaths) {
        console.warn('    checked:', p, 'exists:', fs.existsSync(p));
      }
      db.close();
    } catch (err) {
      console.error('❌ Schema creation failed:', err);
    }
  }

  private ensureDatabaseFile(dbPath: string): void {
    if (fs.existsSync(dbPath)) {
      console.log('✅ Existing database found at:', dbPath);
      return;
    }

    // Try #1: app root inside asar (app.getAppPath()/agripos.db)
    const appPath = app.getAppPath();
    const appRootDb = path.join(appPath, 'agripos.db');
    console.log('  Trying app root path:', appRootDb, 'exists:', fs.existsSync(appRootDb));
    if (fs.existsSync(appRootDb)) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      fs.copyFileSync(appRootDb, dbPath);
      console.log('✅ Copied seed database from app root to:', dbPath);
      return;
    }

    // Try #2: dist/ inside asar
    const asarDb = path.join(appPath, 'dist', 'agripos.db');
    console.log('  Trying asar dist path:', asarDb, 'exists:', fs.existsSync(asarDb));
    if (fs.existsSync(asarDb)) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      fs.copyFileSync(asarDb, dbPath);
      console.log('✅ Copied seed database from asar dist to:', dbPath);
      return;
    }

    // Try #3: extraResources (process.resourcesPath)
    const resourceDb = path.join(process.resourcesPath, 'agripos.db');
    console.log('  Trying resources path:', resourceDb, 'exists:', fs.existsSync(resourceDb));
    if (fs.existsSync(resourceDb)) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      fs.copyFileSync(resourceDb, dbPath);
      console.log('✅ Copied seed database from resources to:', dbPath);
      return;
    }

    console.warn('⚠ Seed database not found. Will try schema.sql fallback.');
    console.warn('  resourcesPath:', process.resourcesPath);
    console.warn('  appPath:', appPath);
  }

  private getActiveClient(): PrismaClient {
    return this.localPrisma as PrismaClient;
  }

  getLocalClient(): PrismaClient {
    return this.localPrisma as PrismaClient;
  }

  // -------------------
  // Generic Operations
  // -------------------

  async testConnection(): Promise<boolean> {
    try {
      const client = this.getActiveClient();
      await client.$queryRaw`SELECT 1`;
      console.log('Local DB connection OK');
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
        type: 'SALE',
      },
    });

    const totalTransactions = await client.transaction.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
        type: 'SALE',
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
          type: 'SALE',
        },
      },
    });

    const creditOutToday = await client.transaction.aggregate({
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
        type: 'PURCHASE',
      },
    });

    return {
      totalSales: totalSales._sum.total || 0,
      totalTransactions,
      totalItemsSold: totalItemsSold._sum.quantity || 0,
      creditOutToday: creditOutToday._sum.total || 0,
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

  async deleteMany<T extends keyof PrismaClient>(table: T, where?: any) {
    const client = this.getActiveClient();
    return (client[table] as any).deleteMany(where || {});
  }

  async disconnect() {
    try {
      if (this.localPrisma) await this.localPrisma.$disconnect();
      console.log('✅ DB disconnected');
    } catch (err) {
      console.error('❌ Error disconnecting DB:', err);
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
