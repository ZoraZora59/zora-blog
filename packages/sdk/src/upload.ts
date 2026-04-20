import type { ZoraClient } from "./client.js";
import type { UploadResult } from "./types.js";

export interface UploadInput {
  /** 文件内容（Node Buffer / ArrayBuffer / Blob 均可） */
  data: Buffer | ArrayBuffer | Uint8Array | Blob;
  filename: string;
  mimeType: string;
}

function toBlob(input: UploadInput): Blob {
  if (input.data instanceof Blob) return input.data;
  if (input.data instanceof ArrayBuffer) {
    return new Blob([input.data], { type: input.mimeType });
  }
  // Buffer & Uint8Array：转成 ArrayBuffer view
  const view = input.data as Uint8Array;
  const ab = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
  return new Blob([ab], { type: input.mimeType });
}

export class UploadsApi {
  constructor(private readonly client: ZoraClient) {}

  async upload(input: UploadInput): Promise<UploadResult> {
    const blob = toBlob(input);
    const form = new FormData();
    form.append("file", blob, input.filename);
    return this.client.request<UploadResult>("/admin/upload", {
      method: "POST",
      body: form,
    });
  }
}
