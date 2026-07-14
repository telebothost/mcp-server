/**
 * Shared types for the TBH MCP server.
 */

/** Result returned by every MCP tool handler. */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

/** A fully-defined MCP tool: name, JSON-Schema input, and async handler. */
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: Record<string, unknown>, client: TbhClientLike) => Promise<any>;
}

/** Subset of TbhClient that tool handlers depend on. */
export interface TbhClientLike {
  get<T = unknown>(path: string, query?: Record<string, unknown>): Promise<TbhResponse<T>>;
  post<T = unknown>(path: string, body?: unknown): Promise<TbhResponse<T>>;
  put<T = unknown>(path: string, body?: unknown): Promise<TbhResponse<T>>;
  patch<T = unknown>(path: string, body?: unknown): Promise<TbhResponse<T>>;
  delete<T = unknown>(path: string, body?: unknown): Promise<TbhResponse<T>>;
  getBinary(path: string, query?: Record<string, unknown>): Promise<TbhResponse<ArrayBuffer>>;
  upload<T = unknown>(path: string, formData: FormData): Promise<TbhResponse<T>>;
}

/** Response wrapper from the TBH API. */
export interface TbhResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

/** Structured error thrown when the TBH API returns a non-2xx status. */
export class TbhApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown,
  ) {
    super(message);
    this.name = "TbhApiError";
  }
}
