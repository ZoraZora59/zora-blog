import type { ApiEnvelope } from "./types.js";

export class ZoraApiError extends Error {
  readonly code: number;
  readonly data: unknown;

  constructor(code: number, message: string, data: unknown = null) {
    super(message);
    this.name = "ZoraApiError";
    this.code = code;
    this.data = data;
  }
}

export interface ZoraClientOptions {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  /** 跳过 JSON 包装解析，返回原始 Response（如文件下载场景） */
  raw?: boolean;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function buildUrl(base: string, path: string, query?: RequestOptions["query"]): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${cleanPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export class ZoraClient {
  readonly baseUrl: string;
  readonly token: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ZoraClientOptions) {
    if (!options.baseUrl) throw new Error("baseUrl is required");
    if (!options.token) throw new Error("token is required");
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error("No fetch implementation available; pass fetchImpl explicitly");
    }
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = buildUrl(this.baseUrl, path, options.query);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      ...options.headers,
    };

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      if (options.body instanceof FormData || options.body instanceof URLSearchParams) {
        body = options.body;
      } else if (typeof options.body === "string") {
        body = options.body;
        headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      } else {
        body = JSON.stringify(options.body);
        headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      }
    }

    const response = await this.fetchImpl(url, {
      method: options.method ?? (body ? "POST" : "GET"),
      headers,
      body,
    });

    if (options.raw) {
      return response as unknown as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      if (!response.ok) {
        throw new ZoraApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
      }
      throw new ZoraApiError(
        response.status,
        `Unexpected content-type: ${contentType || "unknown"}`,
      );
    }

    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok || payload.code >= 400) {
      throw new ZoraApiError(
        payload.code ?? response.status,
        payload.message ?? `HTTP ${response.status}`,
        payload.data,
      );
    }
    return payload.data;
  }

  get<T>(path: string, query?: RequestOptions["query"]): Promise<T> {
    return this.request<T>(path, { method: "GET", query });
  }

  post<T>(path: string, body?: unknown, query?: RequestOptions["query"]): Promise<T> {
    return this.request<T>(path, { method: "POST", body, query });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}
