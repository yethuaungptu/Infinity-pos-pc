-- Migration: 20250927095439_init
-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "taxRate" REAL NOT NULL DEFAULT 0.08,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "receiptHeader" TEXT,
    "receiptFooter" TEXT,
    "printLogo" BOOLEAN NOT NULL DEFAULT false,
    "logoData" TEXT,
    "creditTermsDefault" INTEGER NOT NULL DEFAULT 30,
    "maxCreditLimit" REAL NOT NULL DEFAULT 50000,
    "interestRate" REAL NOT NULL DEFAULT 0.015,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "hireDate" DATETIME NOT NULL,
    "salary" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "lastLogin" DATETIME,
    "permissions" JSONB NOT NULL DEFAULT [],
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "totalCollections" INTEGER NOT NULL DEFAULT 0,
    "averageQuality" REAL,
    "onTimeRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "businessName" TEXT,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
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

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "creditBalance" REAL NOT NULL DEFAULT 0,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "earlyPaymentDiscount" REAL,
    "productTypes" JSONB NOT NULL DEFAULT [],
    "totalPurchases" REAL NOT NULL DEFAULT 0,
    "onTimePaymentRate" REAL NOT NULL DEFAULT 100,
    "lastOrder" DATETIME,
    "lastPayment" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "costPrice" REAL NOT NULL,
    "sellingPrice" REAL NOT NULL,
    "wholesalePrice" REAL,
    "stock" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" DATETIME,
    "batchNumber" TEXT,
    "manufacturer" TEXT,
    "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
    "activeIngredient" TEXT,
    "dosage" TEXT,
    "animalType" TEXT,
    "nutritionInfo" TEXT,
    "feedType" TEXT,
    "primaryVendorId" TEXT NOT NULL,
    "alternateVendors" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_primaryVendorId_fkey" FOREIGN KEY ("primaryVendorId") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "customerId" TEXT,
    "vendorId" TEXT,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balanceAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "staffId" TEXT NOT NULL,
    "notes" TEXT,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "cloudId" TEXT,
    "syncError" TEXT,
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    "grade" TEXT,
    CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transaction_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "egg_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmerId" TEXT NOT NULL,
    "routeId" TEXT,
    "staffId" TEXT NOT NULL,
    "collectionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "henEggsSmall" INTEGER NOT NULL DEFAULT 0,
    "henEggsMedium" INTEGER NOT NULL DEFAULT 0,
    "henEggsLarge" INTEGER NOT NULL DEFAULT 0,
    "henEggsExtraLarge" INTEGER NOT NULL DEFAULT 0,
    "henEggsDamaged" INTEGER NOT NULL DEFAULT 0,
    "totalHenEggs" INTEGER NOT NULL DEFAULT 0,
    "duckEggsSmall" INTEGER NOT NULL DEFAULT 0,
    "duckEggsMedium" INTEGER NOT NULL DEFAULT 0,
    "duckEggsLarge" INTEGER NOT NULL DEFAULT 0,
    "duckEggsDamaged" INTEGER NOT NULL DEFAULT 0,
    "totalDuckEggs" INTEGER NOT NULL DEFAULT 0,
    "henEggPrice" REAL NOT NULL,
    "duckEggPrice" REAL NOT NULL,
    "totalValue" REAL NOT NULL,
    "qualityScore" REAL,
    "qualityNotes" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paymentDate" DATETIME,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "cloudId" TEXT,
    "syncError" TEXT,
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "egg_collections_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "egg_collections_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "collection_routes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "egg_collections_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collection_routes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedTime" INTEGER NOT NULL,
    "estimatedDistance" REAL NOT NULL,
    "schedule" TEXT NOT NULL DEFAULT 'DAILY',
    "staffId" TEXT,
    "averageTime" INTEGER,
    "onTimePercentage" REAL,
    "totalCollections" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "collection_routes_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" DATETIME,
    "receivedDate" DATETIME,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "shipping" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orderedBy" TEXT NOT NULL,
    "receivedBy" TEXT,
    "notes" TEXT,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_orderedBy_fkey" FOREIGN KEY ("orderedBy") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "unitCost" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "customerId" TEXT,
    "vendorId" TEXT,
    "transactionId" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "referenceNumber" TEXT,
    "checkNumber" TEXT,
    "processedBy" TEXT NOT NULL,
    "notes" TEXT,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_records_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payment_records_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payment_records_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payment_records_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STRING',
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "conflictResolution" TEXT
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipientIds" JSONB,
    "globalNotification" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "readBy" TEXT,
    "expiresAt" DATETIME,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "actionData" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "_RouteCustomers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RouteCustomers_A_fkey" FOREIGN KEY ("A") REFERENCES "collection_routes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RouteCustomers_B_fkey" FOREIGN KEY ("B") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_employeeId_key" ON "staff"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staff_username_key" ON "staff"("username");

-- CreateIndex
CREATE INDEX "idx_staff_employee" ON "staff"("employeeId");

-- CreateIndex
CREATE INDEX "idx_staff_username" ON "staff"("username");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "idx_products_sku" ON "products"("sku");

-- CreateIndex
CREATE INDEX "idx_products_type" ON "products"("type");

-- CreateIndex
CREATE INDEX "idx_products_active" ON "products"("active");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_receiptNumber_key" ON "transactions"("receiptNumber");

-- CreateIndex
CREATE INDEX "idx_transactions_customer" ON "transactions"("customerId");

-- CreateIndex
CREATE INDEX "idx_transactions_timestamp" ON "transactions"("timestamp");

-- CreateIndex
CREATE INDEX "idx_transactions_status" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "idx_transactions_receipt" ON "transactions"("receiptNumber");

-- CreateIndex
CREATE INDEX "idx_egg_collections_farmer" ON "egg_collections"("farmerId");

-- CreateIndex
CREATE INDEX "idx_egg_collections_date" ON "egg_collections"("collectionDate");

-- CreateIndex
CREATE INDEX "idx_egg_collections_paid" ON "egg_collections"("paid");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_orderNumber_key" ON "purchase_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "_RouteCustomers_AB_unique" ON "_RouteCustomers"("A", "B");

-- CreateIndex
CREATE INDEX "_RouteCustomers_B_index" ON "_RouteCustomers"("B");


-- Migration: 20250928131343_simplify_address
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


-- Migration: 20250928134546_simplify_address
/*
  Warnings:

  - You are about to alter the column `creditBalance` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `creditLimit` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `totalEggSales` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `totalPurchases` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

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
    "creditLimit" INTEGER NOT NULL DEFAULT 0,
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "creditStatus" TEXT NOT NULL DEFAULT 'CURRENT',
    "farmSize" REAL,
    "animalTypes" JSONB,
    "henEggsDailyProduction" INTEGER NOT NULL DEFAULT 0,
    "duckEggsDailyProduction" INTEGER NOT NULL DEFAULT 0,
    "collectionSchedule" TEXT NOT NULL DEFAULT 'DAILY',
    "isRetail" BOOLEAN NOT NULL DEFAULT false,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPurchases" INTEGER NOT NULL DEFAULT 0,
    "totalEggSales" INTEGER NOT NULL DEFAULT 0,
    "lastPurchase" DATETIME,
    "lastEggCollection" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_customers" ("active", "address", "animalTypes", "businessName", "collectionSchedule", "contactPerson", "createdAt", "creditBalance", "creditLimit", "creditStatus", "duckEggsDailyProduction", "email", "farmSize", "henEggsDailyProduction", "id", "isRetail", "lastEggCollection", "lastPurchase", "loyaltyPoints", "paymentTerms", "phone", "totalEggSales", "totalPurchases", "type", "updatedAt") SELECT "active", "address", "animalTypes", "businessName", "collectionSchedule", "contactPerson", "createdAt", "creditBalance", "creditLimit", "creditStatus", "duckEggsDailyProduction", "email", "farmSize", "henEggsDailyProduction", "id", "isRetail", "lastEggCollection", "lastPurchase", "loyaltyPoints", "paymentTerms", "phone", "totalEggSales", "totalPurchases", "type", "updatedAt" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- Migration: 20250929162105_simplify_address
/*
  Warnings:

  - You are about to alter the column `total` on the `transaction_items` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `unitPrice` on the `transaction_items` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_transaction_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    "grade" TEXT,
    CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transaction_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_transaction_items" ("batchNumber", "expiryDate", "grade", "id", "productId", "productName", "productSku", "quantity", "total", "transactionId", "unit", "unitPrice") SELECT "batchNumber", "expiryDate", "grade", "id", "productId", "productName", "productSku", "quantity", "total", "transactionId", "unit", "unitPrice" FROM "transaction_items";
DROP TABLE "transaction_items";
ALTER TABLE "new_transaction_items" RENAME TO "transaction_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- Migration: 20250929215623_simplify_address
/*
  Warnings:

  - You are about to drop the column `city` on the `staff` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `staff` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `staff` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `staff` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `staff` table. All the data in the column will be lost.
  - You are about to alter the column `salary` on the `staff` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "hireDate" DATETIME NOT NULL,
    "salary" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "lastLogin" DATETIME,
    "permissions" JSONB NOT NULL DEFAULT [],
    "totalCollections" INTEGER DEFAULT 0,
    "averageQuality" REAL,
    "onTimeRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_staff" ("active", "averageQuality", "createdAt", "department", "email", "employeeId", "firstName", "hireDate", "id", "lastLogin", "lastName", "onTimeRate", "password", "permissions", "phone", "position", "salary", "totalCollections", "updatedAt", "username") SELECT "active", "averageQuality", "createdAt", "department", "email", "employeeId", "firstName", "hireDate", "id", "lastLogin", "lastName", "onTimeRate", "password", "permissions", "phone", "position", "salary", "totalCollections", "updatedAt", "username" FROM "staff";
DROP TABLE "staff";
ALTER TABLE "new_staff" RENAME TO "staff";
CREATE UNIQUE INDEX "staff_employeeId_key" ON "staff"("employeeId");
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");
CREATE UNIQUE INDEX "staff_username_key" ON "staff"("username");
CREATE INDEX "idx_staff_employee" ON "staff"("employeeId");
CREATE INDEX "idx_staff_username" ON "staff"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- Migration: 20251003030725_simplify_address
/*
  Warnings:

  - You are about to alter the column `shipping` on the `purchase_orders` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `subtotal` on the `purchase_orders` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `tax` on the `purchase_orders` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.
  - You are about to alter the column `total` on the `purchase_orders` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" DATETIME,
    "receivedDate" DATETIME,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "shipping" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orderedBy" TEXT NOT NULL,
    "receivedBy" TEXT,
    "notes" TEXT,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_orders_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_orderedBy_fkey" FOREIGN KEY ("orderedBy") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_purchase_orders" ("createdAt", "expectedDate", "id", "notes", "orderDate", "orderNumber", "orderedBy", "receivedBy", "receivedDate", "shipping", "status", "subtotal", "synced", "tax", "total", "updatedAt", "vendorId") SELECT "createdAt", "expectedDate", "id", "notes", "orderDate", "orderNumber", "orderedBy", "receivedBy", "receivedDate", "shipping", "status", "subtotal", "synced", "tax", "total", "updatedAt", "vendorId" FROM "purchase_orders";
DROP TABLE "purchase_orders";
ALTER TABLE "new_purchase_orders" RENAME TO "purchase_orders";
CREATE UNIQUE INDEX "purchase_orders_orderNumber_key" ON "purchase_orders"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- Migration: 20260322085750_add_farmer_payable_balance
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
    "creditLimit" INTEGER NOT NULL DEFAULT 0,
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "creditStatus" TEXT NOT NULL DEFAULT 'CURRENT',
    "farmSize" REAL,
    "animalTypes" JSONB,
    "henEggsDailyProduction" INTEGER NOT NULL DEFAULT 0,
    "duckEggsDailyProduction" INTEGER NOT NULL DEFAULT 0,
    "collectionSchedule" TEXT NOT NULL DEFAULT 'DAILY',
    "farmerPayableBalance" REAL NOT NULL DEFAULT 0,
    "isRetail" BOOLEAN NOT NULL DEFAULT false,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPurchases" INTEGER NOT NULL DEFAULT 0,
    "totalEggSales" INTEGER NOT NULL DEFAULT 0,
    "lastPurchase" DATETIME,
    "lastEggCollection" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_customers" ("active", "address", "animalTypes", "businessName", "collectionSchedule", "contactPerson", "createdAt", "creditBalance", "creditLimit", "creditStatus", "duckEggsDailyProduction", "email", "farmSize", "henEggsDailyProduction", "id", "isRetail", "lastEggCollection", "lastPurchase", "loyaltyPoints", "paymentTerms", "phone", "totalEggSales", "totalPurchases", "type", "updatedAt") SELECT "active", "address", "animalTypes", "businessName", "collectionSchedule", "contactPerson", "createdAt", "creditBalance", "creditLimit", "creditStatus", "duckEggsDailyProduction", "email", "farmSize", "henEggsDailyProduction", "id", "isRetail", "lastEggCollection", "lastPurchase", "loyaltyPoints", "paymentTerms", "phone", "totalEggSales", "totalPurchases", "type", "updatedAt" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- Migration: 20260322125615_add_egg_inventory_and_deliveries
-- CreateTable
CREATE TABLE "egg_inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "henEggsSmall" INTEGER NOT NULL DEFAULT 0,
    "henEggsMedium" INTEGER NOT NULL DEFAULT 0,
    "henEggsLarge" INTEGER NOT NULL DEFAULT 0,
    "henEggsExtraLarge" INTEGER NOT NULL DEFAULT 0,
    "duckEggsSmall" INTEGER NOT NULL DEFAULT 0,
    "duckEggsMedium" INTEGER NOT NULL DEFAULT 0,
    "duckEggsLarge" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "egg_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "staffId" TEXT,
    "deliveryDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "henEggsSmall" INTEGER NOT NULL DEFAULT 0,
    "henEggsMedium" INTEGER NOT NULL DEFAULT 0,
    "henEggsLarge" INTEGER NOT NULL DEFAULT 0,
    "henEggsExtraLarge" INTEGER NOT NULL DEFAULT 0,
    "totalHenEggs" INTEGER NOT NULL DEFAULT 0,
    "duckEggsSmall" INTEGER NOT NULL DEFAULT 0,
    "duckEggsMedium" INTEGER NOT NULL DEFAULT 0,
    "duckEggsLarge" INTEGER NOT NULL DEFAULT 0,
    "totalDuckEggs" INTEGER NOT NULL DEFAULT 0,
    "henEggPrice" REAL NOT NULL,
    "duckEggPrice" REAL NOT NULL,
    "totalValue" REAL NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "egg_deliveries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "egg_deliveries_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "idx_egg_deliveries_date" ON "egg_deliveries"("deliveryDate");

-- CreateIndex
CREATE INDEX "idx_egg_deliveries_status" ON "egg_deliveries"("status");
