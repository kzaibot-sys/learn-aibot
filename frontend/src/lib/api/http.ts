import { getApiBaseUrl } from "@/lib/api/config";

export class ApiClientError extends Error {
  status: number;
  code?: string;
  requestId?: string;

  constructor(message: string, options: { status: number; code?: string; requestId?: string }) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
  }
}

interface RequestJsonOptions extends RequestInit {
  token?: string | null;
}

export async function requestJson<T>(
  path: string,
  options: RequestJsonOptions = {},
): Promise<T> {
  const { token, headers: rawHeaders, body, ...rest } = options;
  const headers = new Headers(rawHeaders ?? {});

  const hasBody = body !== undefined && body !== null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers,
    body,
  });

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  const payload = parseJson(text);

  if (!response.ok) {
    const normalized = normalizeError(payload, response.status, response.statusText);
    throw new ApiClientError(normalized.message, normalized);
  }

  if (payload === undefined) {
    return null as T;
  }

  return payload as T;
}

function parseJson(input: string): unknown | undefined {
  if (!input) {
    return undefined;
  }
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return undefined;
  }
}

function normalizeError(payload: unknown, status: number, fallbackStatusText: string) {
  if (payload && typeof payload === "object") {
    const maybe = payload as {
      message?: unknown;
      error?: unknown;
      code?: unknown;
      requestId?: unknown;
    };
    const message =
      typeof maybe.message === "string"
        ? maybe.message
        : typeof maybe.error === "string"
          ? maybe.error
          : `${status} ${fallbackStatusText}`.trim();
    return {
      status,
      message,
      code: typeof maybe.code === "string" ? maybe.code : undefined,
      requestId: typeof maybe.requestId === "string" ? maybe.requestId : undefined,
    };
  }

  return {
    status,
    message: `${status} ${fallbackStatusText}`.trim(),
    code: undefined,
    requestId: undefined,
  };
}

