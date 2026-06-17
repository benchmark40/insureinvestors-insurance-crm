/**
 * Minimal REST wrapper for the Ascend API. Reads creds + producer/account-manager
 * defaults from env. Ported from the legacy `ascend/views.py` (sandbox URLs).
 */

type AscendConfig = {
  apiKey: string;
  baseUrl: string;
  producerId: string;
  accountManagerId: string;
};

function readConfig(): AscendConfig {
  const apiKey = process.env.ASCEND_API_KEY ?? "";
  const baseUrl =
    process.env.ASCEND_API_URL ?? "https://sandbox.api.useascend.com/v1";
  const producerId = process.env.ASCEND_PRODUCER_ID ?? "";
  const accountManagerId = process.env.ASCEND_ACCOUNT_MANAGER_ID ?? "";
  if (!apiKey) {
    throw new Error(
      "Ascend is not configured — set ASCEND_API_KEY (and optionally ASCEND_API_URL, ASCEND_PRODUCER_ID, ASCEND_ACCOUNT_MANAGER_ID).",
    );
  }
  return { apiKey, baseUrl, producerId, accountManagerId };
}

export function ascendDefaults(): {
  producerId: string;
  accountManagerId: string;
} {
  const cfg = readConfig();
  return {
    producerId: cfg.producerId,
    accountManagerId: cfg.accountManagerId,
  };
}

export class AscendError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(`Ascend ${status}: ${detail}`);
    this.status = status;
    this.detail = detail;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function ascendFetch<T = unknown>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const cfg = readConfig();
  const url = `${cfg.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const init: RequestInit = {
    method,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${cfg.apiKey}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(url, init);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!res.ok) throw new AscendError(res.status, text);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

/**
 * Recognize "this resource already exists" responses. Ascend returns 409
 * sometimes and 400 with a nested errors[].status=409 other times.
 */
export function isConflict(err: unknown): boolean {
  if (!(err instanceof AscendError)) return false;
  if (err.status === 409) return true;
  if (err.status === 400) {
    try {
      const data = JSON.parse(err.detail) as {
        errors?: { status?: number; detail?: string }[];
      };
      return (data.errors ?? []).some(
        (e) =>
          e.status === 409 ||
          (typeof e.detail === "string" &&
            e.detail.toLowerCase().includes("already been taken")),
      );
    } catch {
      return false;
    }
  }
  return false;
}
