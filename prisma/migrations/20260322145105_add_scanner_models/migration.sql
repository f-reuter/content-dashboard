-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "profileUrl" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ScannedContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitorId" TEXT,
    "platform" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT,
    "caption" TEXT,
    "url" TEXT,
    "thumbnailUrl" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" DATETIME,
    "viralScore" REAL,
    "hashtags" TEXT,
    "contentType" TEXT,
    "aiAnalysis" TEXT,
    "savedAsIdea" BOOLEAN NOT NULL DEFAULT false,
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScannedContent_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrendSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT,
    "urgency" INTEGER NOT NULL DEFAULT 3,
    "pillar" TEXT,
    "hookIdea" TEXT,
    "source" TEXT,
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_platform_handle_key" ON "Competitor"("platform", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "ScannedContent_platform_externalId_key" ON "ScannedContent"("platform", "externalId");
