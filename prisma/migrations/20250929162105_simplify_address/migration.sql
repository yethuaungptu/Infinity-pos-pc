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
