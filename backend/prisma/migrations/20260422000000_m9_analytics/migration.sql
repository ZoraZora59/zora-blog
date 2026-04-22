-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('home', 'article', 'category', 'topic', 'about', 'search', 'other');

-- CreateEnum
CREATE TYPE "ReferrerType" AS ENUM ('direct', 'search', 'social', 'external', 'internal');

-- CreateTable
CREATE TABLE "page_views" (
    "id" BIGSERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "pageType" "PageType" NOT NULL DEFAULT 'other',
    "articleId" INTEGER,
    "categoryId" INTEGER,
    "topicId" INTEGER,
    "visitorId" VARCHAR(64) NOT NULL,
    "sessionId" VARCHAR(64) NOT NULL,
    "isNewVisitor" BOOLEAN NOT NULL DEFAULT false,
    "isNewSession" BOOLEAN NOT NULL DEFAULT false,
    "referrer" VARCHAR(1024),
    "referrerHost" TEXT,
    "referrerType" "ReferrerType" NOT NULL DEFAULT 'direct',
    "utmSource" VARCHAR(256),
    "utmMedium" VARCHAR(256),
    "utmCampaign" VARCHAR(256),
    "userAgent" VARCHAR(512) NOT NULL,
    "device" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "screenWidth" INTEGER,
    "screenHeight" INTEGER,
    "viewportWidth" INTEGER,
    "language" TEXT,
    "ipHash" VARCHAR(64) NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_site_stats" (
    "date" DATE NOT NULL,
    "pv" INTEGER NOT NULL DEFAULT 0,
    "uv" INTEGER NOT NULL DEFAULT 0,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "newVisitors" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION,
    "avgPagesPerSession" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_site_stats_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "daily_article_stats" (
    "date" DATE NOT NULL,
    "articleId" INTEGER NOT NULL,
    "pv" INTEGER NOT NULL DEFAULT 0,
    "uv" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_article_stats_pkey" PRIMARY KEY ("date","articleId")
);

-- CreateTable
CREATE TABLE "daily_referrer_stats" (
    "date" DATE NOT NULL,
    "referrerHost" TEXT NOT NULL,
    "referrerType" "ReferrerType" NOT NULL DEFAULT 'direct',
    "pv" INTEGER NOT NULL DEFAULT 0,
    "uv" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_referrer_stats_pkey" PRIMARY KEY ("date","referrerHost")
);

-- CreateTable
CREATE TABLE "daily_geo_stats" (
    "date" DATE NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT '',
    "pv" INTEGER NOT NULL DEFAULT 0,
    "uv" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_geo_stats_pkey" PRIMARY KEY ("date","country","region")
);

-- CreateTable
CREATE TABLE "daily_device_stats" (
    "date" DATE NOT NULL,
    "device" TEXT NOT NULL,
    "os" TEXT NOT NULL DEFAULT '',
    "browser" TEXT NOT NULL DEFAULT '',
    "pv" INTEGER NOT NULL DEFAULT 0,
    "uv" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_device_stats_pkey" PRIMARY KEY ("date","device","os","browser")
);

-- CreateTable
CREATE TABLE "daily_category_stats" (
    "date" DATE NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "pv" INTEGER NOT NULL DEFAULT 0,
    "uv" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_category_stats_pkey" PRIMARY KEY ("date","categoryId")
);

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");

-- CreateIndex
CREATE INDEX "page_views_articleId_createdAt_idx" ON "page_views"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "page_views_categoryId_createdAt_idx" ON "page_views"("categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "page_views_country_createdAt_idx" ON "page_views"("country", "createdAt");

-- CreateIndex
CREATE INDEX "page_views_referrerHost_createdAt_idx" ON "page_views"("referrerHost", "createdAt");

-- CreateIndex
CREATE INDEX "page_views_visitorId_createdAt_idx" ON "page_views"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "page_views_sessionId_idx" ON "page_views"("sessionId");

-- CreateIndex
CREATE INDEX "daily_article_stats_articleId_date_idx" ON "daily_article_stats"("articleId", "date");

