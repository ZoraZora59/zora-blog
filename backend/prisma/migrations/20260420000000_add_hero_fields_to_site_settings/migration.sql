ALTER TABLE "site_settings"
ADD COLUMN "heroBadge" TEXT,
ADD COLUMN "heroTitle" TEXT,
ADD COLUMN "heroSubtitle" TEXT,
ADD COLUMN "heroPrimaryText" TEXT,
ADD COLUMN "heroPrimaryHref" TEXT,
ADD COLUMN "heroSecondaryText" TEXT,
ADD COLUMN "heroSecondaryHref" TEXT,
ADD COLUMN "heroImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
