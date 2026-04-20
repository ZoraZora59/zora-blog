import { access } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma.js';
import { uploadLocalFileToCloud } from '../src/lib/media-storage.js';
import { uploadsDir } from '../src/lib/uploads.js';

type ResourceType = 'admin.avatar' | 'article.coverImage' | 'topic.coverImage' | 'site.logo';

interface MediaRecord {
  type: ResourceType;
  id: number;
  value: string;
}

interface MigrationResult {
  scanned: number;
  migrated: number;
  skipped: number;
  missingFiles: Array<{ type: ResourceType; id: number; value: string; filePath: string }>;
  failed: Array<{ type: ResourceType; id: number; value: string; reason: string }>;
}

const DRY_RUN = process.argv.includes('--dry-run');

function extractLegacyUploadFilename(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('/uploads/')) {
    return path.basename(trimmed);
  }

  if (trimmed.startsWith('uploads/')) {
    return path.basename(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      return path.basename(parsed.pathname);
    }
  } catch {
    return null;
  }

  return null;
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectMediaRecords() {
  const [admins, articles, topics, settings] = await Promise.all([
    prisma.admin.findMany({ select: { id: true, avatar: true } }),
    prisma.article.findMany({ select: { id: true, coverImage: true } }),
    prisma.topic.findMany({ select: { id: true, coverImage: true } }),
    prisma.siteSettings.findMany({ select: { id: true, logo: true } }),
  ]);

  const records: MediaRecord[] = [];

  for (const row of admins) {
    if (row.avatar && extractLegacyUploadFilename(row.avatar)) {
      records.push({ type: 'admin.avatar', id: row.id, value: row.avatar });
    }
  }

  for (const row of articles) {
    if (row.coverImage && extractLegacyUploadFilename(row.coverImage)) {
      records.push({ type: 'article.coverImage', id: row.id, value: row.coverImage });
    }
  }

  for (const row of topics) {
    if (row.coverImage && extractLegacyUploadFilename(row.coverImage)) {
      records.push({ type: 'topic.coverImage', id: row.id, value: row.coverImage });
    }
  }

  for (const row of settings) {
    if (row.logo && extractLegacyUploadFilename(row.logo)) {
      records.push({ type: 'site.logo', id: row.id, value: row.logo });
    }
  }

  return records;
}

async function updateRecordUrl(record: MediaRecord, url: string) {
  switch (record.type) {
    case 'admin.avatar':
      await prisma.admin.update({
        where: { id: record.id },
        data: { avatar: url },
      });
      break;
    case 'article.coverImage':
      await prisma.article.update({
        where: { id: record.id },
        data: { coverImage: url },
      });
      break;
    case 'topic.coverImage':
      await prisma.topic.update({
        where: { id: record.id },
        data: { coverImage: url },
      });
      break;
    case 'site.logo':
      await prisma.siteSettings.update({
        where: { id: record.id },
        data: { logo: url },
      });
      break;
  }
}

async function main() {
  const records = await collectMediaRecords();
  const result: MigrationResult = {
    scanned: records.length,
    migrated: 0,
    skipped: 0,
    missingFiles: [],
    failed: [],
  };

  if (records.length === 0) {
    console.warn(
      JSON.stringify({ message: '没有发现需要迁移的本地媒体引用', dryRun: DRY_RUN }, null, 2),
    );
    return;
  }

  const uploadedUrlByFileName = new Map<string, string>();

  for (const record of records) {
    const fileName = extractLegacyUploadFilename(record.value);
    if (!fileName) {
      result.skipped += 1;
      continue;
    }

    const filePath = path.join(uploadsDir, fileName);
    if (!(await fileExists(filePath))) {
      result.missingFiles.push({ type: record.type, id: record.id, value: record.value, filePath });
      continue;
    }

    try {
      let targetUrl = uploadedUrlByFileName.get(fileName);
      if (!targetUrl) {
        if (DRY_RUN) {
          targetUrl = `DRY_RUN://qiniu/${fileName}`;
        } else {
          const uploaded = await uploadLocalFileToCloud(filePath, {
            fileName,
            originalName: fileName,
            subdirectory: 'legacy',
          });
          targetUrl = uploaded.url;
        }
        uploadedUrlByFileName.set(fileName, targetUrl);
      }

      if (DRY_RUN) {
        result.skipped += 1;
        continue;
      }

      await updateRecordUrl(record, targetUrl);
      result.migrated += 1;
    } catch (error) {
      result.failed.push({
        type: record.type,
        id: record.id,
        value: record.value,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.warn(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        uploadsDir,
        summary: result,
      },
      null,
      2,
    ),
  );

  if (result.failed.length > 0 || result.missingFiles.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
