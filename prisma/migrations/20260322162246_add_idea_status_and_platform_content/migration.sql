-- AlterTable
ALTER TABLE "Post" ADD COLUMN "platformContent" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Idea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hook" TEXT NOT NULL,
    "description" TEXT,
    "pillar" TEXT NOT NULL,
    "format" TEXT,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "sourceVideoUrls" TEXT,
    "convertedToPostId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Idea" ("convertedToPostId", "createdAt", "description", "format", "hook", "id", "pillar", "rating", "sourceVideoUrls") SELECT "convertedToPostId", "createdAt", "description", "format", "hook", "id", "pillar", "rating", "sourceVideoUrls" FROM "Idea";
DROP TABLE "Idea";
ALTER TABLE "new_Idea" RENAME TO "Idea";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
