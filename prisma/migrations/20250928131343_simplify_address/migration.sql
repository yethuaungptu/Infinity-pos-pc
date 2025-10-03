/*
  Warnings:

  - You are about to drop the column `city` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `customers` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "businessName" TEXT,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "creditBalance" REAL NOT NULL DEFAULT 0,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "creditStatus" TEXT NOT NULL DEFAULT 'CURRENT',
    "farmSize" REAL,
    "animalTypes" JSONB,
    "henEggsDailyProduction" INTEGER NOT NULL DEFAULT 0,
    "duckEggsDailyProduction" INTEGER NOT NULL DEFAULT 0,
    "collectionSchedule" TEXT NOT NULL DEFAULT 'DAILY',
    "isRetail" BOOLEAN NOT NULL DEFAULT false,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPurchases" REAL NOT NULL DEFAULT 0,
    "totalEggSales" REAL NOT NULL DEFAULT 0,
    "lastPurchase" DATETIME,
    "lastEggCollection" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_customers" ("active", "animalTypes", "businessName", "collectionSchedule", "contactPerson", "createdAt", "creditBalance", "creditLimit", "creditStatus", "duckEggsDailyProduction", "email", "farmSize", "henEggsDailyProduction", "id", "isRetail", "lastEggCollection", "lastPurchase", "loyaltyPoints", "paymentTerms", "phone", "totalEggSales", "totalPurchases", "type", "updatedAt") SELECT "active", "animalTypes", "businessName", "collectionSchedule", "contactPerson", "createdAt", "creditBalance", "creditLimit", "creditStatus", "duckEggsDailyProduction", "email", "farmSize", "henEggsDailyProduction", "id", "isRetail", "lastEggCollection", "lastPurchase", "loyaltyPoints", "paymentTerms", "phone", "totalEggSales", "totalPurchases", "type", "updatedAt" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
