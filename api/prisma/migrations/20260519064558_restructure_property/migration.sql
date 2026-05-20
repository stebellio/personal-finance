/*
  Warnings:

  - You are about to drop the column `purchaseDate` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `purchasePrice` on the `Property` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'building',
    "category" TEXT,
    "state" TEXT,
    "address" TEXT,
    "surface" REAL,
    "cadastralSheet" TEXT,
    "cadastralParcel" TEXT,
    "cadastralSubaltern" TEXT,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("address", "createdAt", "currency", "currentValue", "description", "id", "name", "surface", "type", "updatedAt", "userId") SELECT "address", "createdAt", "currency", "currentValue", "description", "id", "name", "surface", "type", "updatedAt", "userId" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE UNIQUE INDEX "Property_userId_name_key" ON "Property"("userId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
