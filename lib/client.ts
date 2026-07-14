/**
 * TeleBotHost Developer API client.
 *
 * Wraps fetch with:
 *   - Bearer token auth (sk_* or pub_*)
 *   - Automatic JSON serialization / parsing
 *   - Binary (ArrayBuffer) response support for file downloads
 *   - Multipart form-data upload support for file imports
 *   - 429 retry with exponential backoff
 *   - Structured error throwing (TbhApiError)
 *   - Rate-limit header capture
 */

import { TbhApiError, type TbhResponse } from "./types.js";

const DEFAULT_BASE_URL = "https://api.telebothost.com/api/v1";
const MAX_RETRIES = 3;

export class TbhClient {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor(opts?: { apiKey?: string; baseUrl?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.TELEBOTHOST_API_KEY;
    this.baseUrl =
      opts?.baseUrl ?? process.env.TELEBOTHOST_API_BASE ?? DEFAULT_BASE_URL;
  }

  /** True when an API key is configured. */
  hasKey(): boolean {
    return !!this.apiKey;
  }

  // -----------------------------------------------------------------------
  // Convenience verbs — JSON in / JSON out
  // -----------------------------------------------------------------------

  get<T = unknown>(path: string, query?: Record<string, unknown>): Promise<TbhResponse<T>> {
    return this.request<T>("GET", path, { query });
  }

  post<T = unknown>(path: string, body?: unknown): Promise<TbhResponse<T>> {
    return this.request<T>("POST", path, { body });
  }

  put<T = unknown>(path: string, body?: unknown): Promise<TbhResponse<T>> {
    return this.request<T>("PUT", path, { body });
  }

  patch<T = unknown>(path: string, body?: unknown): Promise<TbhResponse<T>> {
    return this.request<T>("PATCH", path, { body });
  }

  delete<T = unknown>(path: string, body?: unknown): Promise<TbhResponse<T>> {
    return this.request<T>("DELETE", path, { body });
  }

  // -----------------------------------------------------------------------
  // Binary helpers — for file upload / download
  // -----------------------------------------------------------------------

  /** Download a binary resource. Returns raw ArrayBuffer + content-type. */
  getBinary(
    path: string,
    query?: Record<string, unknown>,
  ): Promise<TbhResponse<ArrayBuffer>> {
    return this.request<ArrayBuffer>("GET", path, { query, binary: true });
  }

  /** Upload a binary body using multipart/form-data. */
  upload<T = unknown>(
    path: string,
    formData: FormData,
  ): Promise<TbhResponse<T>> {
    return this.request<T>("POST", path, { body: formData });
  }

  // -----------------------------------------------------------------------
  // Core request engine
  // -----------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    opts: {
      query?: Record<string, unknown>;
      body?: unknown;
      headers?: Record<string, string>;
      binary?: boolean;
    } = {},
  ): Promise<TbhResponse<T>> {
    const url = new URL(this.baseUrl.replace(/\/$/, "") + path);

    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, String(v));
        }
      }
    }

    const headers: Record<string, string> = {
      Accept: opts.binary ? "*/*" : "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Referer: "https://api.telebothost.com/api/v1/docs",
      ...opts.headers,
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    let body: string | FormData | undefined;
    if (opts.body !== undefined) {
      if (opts.body instanceof FormData) {
        // Let fetch set the multipart boundary automatically
        body = opts.body;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(opts.body);
      }
    }

    let lastErr: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url.toString(), { method, headers, body });

        // Retry on 429 with exponential backoff
        if (res.status === 429 && attempt < MAX_RETRIES) {
          const retryAfter = parseFloat(res.headers.get("Retry-After") || "0");
          const delayMs = retryAfter > 0
            ? retryAfter * 1000
            : Math.min(2000 * 2 ** attempt, 16000);
          await sleep(delayMs);
          continue;
        }

        // --- Binary response path ---
        if (opts.binary) {
          if (!res.ok) {
            const text = await res.text();
            let errMsg = `HTTP ${res.status}`;
            try {
              const j = JSON.parse(text);
              errMsg = j.message || j.reason || errMsg;
            } catch {
              if (text.length > 200) errMsg = text.substring(0, 200) + "... (truncated)";
              else errMsg = text || errMsg;
            }
            throw new TbhApiError(errMsg, res.status, text);
          }
          const buf = await res.arrayBuffer();
          return { data: buf as T, status: res.status, headers: res.headers };
        }

        // --- JSON / text response path ---
        const text = await res.text();
        let data: unknown;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        if (!res.ok) {
          // Truncate huge HTML error pages (e.g. Cloudflare challenges)
          let errMsg =
            (data as { message?: string; reason?: string })?.message ||
            (data as { reason?: string })?.reason ||
            `HTTP ${res.status}`;
          if (typeof data === "string" && data.length > 200) {
            errMsg = data.substring(0, 200) + "... (truncated)";
          }
          // Detect Cloudflare challenge
          if (res.status === 403 && typeof data === "string" && data.includes("cf_chl")) {
            errMsg = "Cloudflare challenge — the TBH API is blocking this request. Authenticated requests with an API key (sk_*) may bypass this.";
          }
          throw new TbhApiError(errMsg, res.status, typeof data === "string" ? errMsg : data);
        }

        return { data: data as T, status: res.status, headers: res.headers };
      } catch (err) {
        if (err instanceof TbhApiError) throw err;
        lastErr = err;
        if (attempt < MAX_RETRIES) {
          await sleep(Math.min(1000 * 2 ** attempt, 8000));
          continue;
        }
      }
    }

    throw lastErr ?? new Error("Request failed after retries");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
