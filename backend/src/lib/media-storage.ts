import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import qiniu from 'qiniu';
import { AppError } from './app-error.js';
import { env } from './env.js';
import { allowedMimeTypes } from './uploads.js';

const PUBLIC_DOMAIN_PREFIX = /^https?:\/\//i;
const extensionMimeTypes = Object.fromEntries(
  Object.entries(allowedMimeTypes).map(([mimeType, extension]) => [extension, mimeType]),
) as Record<string, string>;

export interface CloudUploadResult {
  key: string;
  filename: string;
  url: string;
}

interface QiniuClient {
  bucket: string;
  bucketManager: qiniu.rs.BucketManager;
  formUploader: qiniu.form_up.FormUploader;
  mac: qiniu.auth.digest.Mac;
}

let client: QiniuClient | null = null;
let bucketAccessModePromise: Promise<void> | null = null;
let publicBaseUrlPromise: Promise<string> | null = null;

function normalizePath(value: string) {
  return value
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
}

function normalizePublicBaseUrl(value: string) {
  const normalized = value.trim().replace(/\/$/, '');
  if (!normalized) {
    return '';
  }

  return PUBLIC_DOMAIN_PREFIX.test(normalized) ? normalized : `https://${normalized}`;
}

function encodeObjectKey(key: string) {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function resolveMimeTypeByFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  return extensionMimeTypes[extension] ?? 'application/octet-stream';
}

function getQiniuEnvDirectory() {
  return env.nodeEnv === 'production' || env.nodeEnv === 'prod' ? 'prod' : 'non-prod';
}

function getObjectPrefix() {
  const rootPrefix = normalizePath(env.qiniuRootPrefix);
  return [rootPrefix, getQiniuEnvDirectory()].filter(Boolean).join('/');
}

function getQiniuClient() {
  if (client) {
    return client;
  }

  if (!env.qiniuAccessKey || !env.qiniuSecretKey || !env.qiniuBucket) {
    throw new AppError(
      '缺少七牛云配置，请检查 QINIU_ACCESS_KEY、QINIU_SECRET_KEY、QINIU_BUCKET',
      500,
    );
  }

  const mac = new qiniu.auth.digest.Mac(env.qiniuAccessKey, env.qiniuSecretKey);
  const config = new qiniu.conf.Config({
    useHttpsDomain: true,
  });

  client = {
    bucket: env.qiniuBucket,
    bucketManager: new qiniu.rs.BucketManager(mac, config),
    formUploader: new qiniu.form_up.FormUploader(config),
    mac,
  };

  return client;
}

async function resolvePublicBaseUrl() {
  if (env.qiniuPublicBaseUrl) {
    return normalizePublicBaseUrl(env.qiniuPublicBaseUrl);
  }

  if (!publicBaseUrlPromise) {
    const qiniuClient = getQiniuClient();
    publicBaseUrlPromise = qiniuClient.bucketManager
      .listBucketDomains(qiniuClient.bucket)
      .then((result) => {
        const domain = result.data?.[0]?.domain?.trim();
        if (!domain) {
          throw new AppError('七牛云空间未配置可访问域名，请设置 QINIU_PUBLIC_BASE_URL', 500);
        }

        return normalizePublicBaseUrl(domain);
      })
      .catch((error) => {
        publicBaseUrlPromise = null;
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError('读取七牛云空间域名失败', 502, 502, error);
      });
  }

  return publicBaseUrlPromise;
}

async function ensureBucketIsPublic() {
  if (!bucketAccessModePromise) {
    const qiniuClient = getQiniuClient();
    bucketAccessModePromise = qiniuClient.bucketManager
      .getBucketInfo(qiniuClient.bucket)
      .then((result) => {
        if (result.data?.private === 1) {
          throw new AppError(
            `七牛云空间 ${qiniuClient.bucket} 当前为私有空间，请调整为公开空间后再上传图片`,
            500,
          );
        }
      })
      .catch((error) => {
        bucketAccessModePromise = null;
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError('读取七牛云空间配置失败', 502, 502, error);
      });
  }

  return bucketAccessModePromise;
}

async function uploadBufferToCloud(options: {
  buffer: Buffer;
  objectKey: string;
  fileName: string;
  originalName: string;
  mimeType: string;
}) {
  const { bucket, formUploader, mac } = getQiniuClient();
  await ensureBucketIsPublic();
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${bucket}:${options.objectKey}`,
  });
  const putExtra = new qiniu.form_up.PutExtra();
  putExtra.fname = options.originalName;
  putExtra.mimeType = options.mimeType;

  try {
    const uploadToken = putPolicy.uploadToken(mac);
    const result = await formUploader.put(uploadToken, options.objectKey, options.buffer, putExtra);

    if (!result.ok()) {
      throw new AppError('上传到七牛云失败', 502, 502, result.data?.error ?? result.data);
    }

    const publicBaseUrl = await resolvePublicBaseUrl();
    return {
      key: options.objectKey,
      filename: options.fileName,
      url: `${publicBaseUrl}/${encodeObjectKey(options.objectKey)}`,
    } satisfies CloudUploadResult;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('上传到七牛云失败', 502, 502, error);
  }
}

function buildObjectKey(fileName: string, subdirectory?: string) {
  const normalizedSubdirectory = normalizePath(subdirectory ?? '');
  return [getObjectPrefix(), normalizedSubdirectory, fileName].filter(Boolean).join('/');
}

export async function uploadImageToCloud(file: File) {
  const extension = allowedMimeTypes[file.type];
  if (!extension) {
    throw new AppError('仅支持 jpg/png/webp/gif 图片');
  }

  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  return uploadBufferToCloud({
    buffer: Buffer.from(await file.arrayBuffer()),
    objectKey: buildObjectKey(fileName),
    fileName,
    originalName: file.name,
    mimeType: file.type,
  });
}

export async function uploadLocalFileToCloud(
  localFilePath: string,
  options?: {
    fileName?: string;
    originalName?: string;
    mimeType?: string;
    subdirectory?: string;
  },
) {
  const fileName = options?.fileName ?? path.basename(localFilePath);
  const mimeType = options?.mimeType ?? resolveMimeTypeByFileName(fileName);

  return uploadBufferToCloud({
    buffer: await readFile(localFilePath),
    objectKey: buildObjectKey(fileName, options?.subdirectory),
    fileName,
    originalName: options?.originalName ?? fileName,
    mimeType,
  });
}
