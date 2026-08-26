'use client';

/**
 * API client.
 *
 * The access token is held in memory only — never localStorage — so an XSS
 * cannot exfiltrate it. Refresh happens through an httpOnly cookie the JS side
 * cannot read, and a 401 triggers exactly one refresh attempt, with concurrent
 * callers sharing it rather than stampeding.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101';

const VIEWING_ORG_KEY = 'fitai.viewingOrg';

let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * The centre a platform operator is currently looking at, sent as X-Org-Id.
 *
 * localStorage, unlike the access token: this is not a credential. The header
 * only does anything for a SUPERADMIN — the API ignores it for everyone else
 * and refuses writes while it is set — so persisting it just means a refresh
 * doesn't kick the operator out of the centre they were inspecting.
 */
export function setViewingOrg(orgId: string | null): void {
  if (typeof window === 'undefined') return;
  if (orgId) window.localStorage.setItem(VIEWING_ORG_KEY, orgId);
  else window.localStorage.removeItem(VIEWING_ORG_KEY);
}

export function getViewingOrg(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(VIEWING_ORG_KEY);
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readError(res: Response): Promise<ApiError> {
  let message = res.statusText || `Request failed (${res.status})`;
  let fieldErrors: { field: string; message: string }[] | undefined;
  try {
    const body = (await res.json()) as {
      message?: string | string[];
      errors?: { field: string; message: string }[];
    };
    if (Array.isArray(body.message)) message = body.message.join(', ');
    else if (body.message) message = body.message;
    if (body.errors) {
      fieldErrors = body.errors;
      // Surface the actual validation problem rather than a bare "Validation failed".
      message = body.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
    }
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, message, fieldErrors);
}

async function refresh(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { accessToken: string };
      accessToken = body.accessToken;
      return body.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retrying = false,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  // Platform routes are about orgs rather than inside one, so they must not
  // inherit the centre being viewed — /platform/orgs would otherwise scope its
  // own listing to one tenant.
  const viewingOrg = path.startsWith('/platform/') ? null : getViewingOrg();
  if (viewingOrg) headers.set('x-org-id', viewingOrg);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }

  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !retrying && !path.startsWith('/auth/')) {
    const fresh = await refresh();
    if (fresh) return request<T>(path, init, true);
  }

  if (!res.ok) throw await readError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** Multipart upload (recording capture from the browser call). */
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form }),
  /**
   * Download a file the browser can't fetch with a plain link.
   *
   * Exports are behind the bearer token, so an <a href> would 401. Fetch it,
   * then hand the blob to a synthetic anchor.
   */
  download: async (path: string): Promise<void> => {
    const headers = new Headers();
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    const org = getViewingOrg();
    if (org) headers.set('x-org-id', org);
    const res = await fetch(`${BASE}/api${path}`, { headers, credentials: 'include' });
    if (!res.ok) throw await readError(res);

    // Honour the server's filename rather than inventing one.
    const disposition = res.headers.get('content-disposition') ?? '';
    const match = /filename="?([^";]+)"?/.exec(disposition);
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = match?.[1] ?? 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  /** Absolute URL, for media the browser fetches directly. */
  absolute: (path: string) => `${BASE}/api${path}`,
  baseUrl: BASE,
};

/** Build a query string, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
