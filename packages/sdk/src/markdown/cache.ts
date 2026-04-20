import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export interface CachedImage {
  sha256: string;
  url: string;
  uploadedAt: string;
}

export interface ImageCacheFile {
  version: 1;
  images: Record<string, CachedImage>;
}

export class ImageCache {
  private readonly cachePath: string;
  private data: ImageCacheFile = { version: 1, images: {} };
  private loaded = false;

  constructor(baseDir: string, filename = ".zora-cache.json") {
    this.cachePath = path.join(baseDir, filename);
  }

  async load(): Promise<void> {
    if (this.loaded) return;
    if (existsSync(this.cachePath)) {
      try {
        const raw = await readFile(this.cachePath, "utf8");
        const parsed = JSON.parse(raw) as ImageCacheFile;
        if (parsed.version === 1 && parsed.images) {
          this.data = parsed;
        }
      } catch {
        // 损坏的缓存文件忽略，重新开始
      }
    }
    this.loaded = true;
  }

  /** 查：key = markdown 中引用的相对路径 */
  get(relPath: string): CachedImage | undefined {
    return this.data.images[relPath];
  }

  set(relPath: string, entry: CachedImage): void {
    this.data.images[relPath] = entry;
  }

  async save(): Promise<void> {
    if (!this.loaded) return;
    await writeFile(this.cachePath, JSON.stringify(this.data, null, 2) + "\n", "utf8");
  }

  get filePath(): string {
    return this.cachePath;
  }
}

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
