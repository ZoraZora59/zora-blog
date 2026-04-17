ALTER TABLE "site_settings"
ADD COLUMN "slogan" TEXT,
ADD COLUMN "aboutContent" TEXT,
ADD COLUMN "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "githubUrl" TEXT,
ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "instagramUrl" TEXT,
ADD COLUMN "email" TEXT;

ALTER TABLE "articles"
ADD COLUMN "search_vector" tsvector;

CREATE OR REPLACE FUNCTION update_articles_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(
      to_tsvector(
        'simple',
        COALESCE(
          regexp_replace(NEW.content, '[`#*_\\[\\]()!>\\-]+', ' ', 'g'),
          ''
        )
      ),
      'C'
    );

  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_search_vector_trigger ON "articles";

CREATE TRIGGER articles_search_vector_trigger
BEFORE INSERT OR UPDATE OF "title", "excerpt", "content"
ON "articles"
FOR EACH ROW
EXECUTE FUNCTION update_articles_search_vector();

UPDATE "articles"
SET "search_vector" =
  setweight(to_tsvector('simple', COALESCE("title", '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE("excerpt", '')), 'B') ||
  setweight(
    to_tsvector(
      'simple',
      COALESCE(
        regexp_replace("content", '[`#*_\\[\\]()!>\\-]+', ' ', 'g'),
        ''
      )
    ),
    'C'
  );

CREATE INDEX "articles_search_vector_idx"
ON "articles"
USING GIN ("search_vector");
