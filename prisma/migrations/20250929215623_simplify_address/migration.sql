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
