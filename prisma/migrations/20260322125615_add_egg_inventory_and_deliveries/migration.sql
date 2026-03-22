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
