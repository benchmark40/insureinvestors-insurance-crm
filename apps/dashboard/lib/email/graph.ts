/**
 * Microsoft Graph sendMail — app-only (client_credentials) flow.
 * Ported from legacy benchmark/utils.py:send_submission.
 *
 * Sends as a fixed mailbox (GRAPH_FROM_MAILBOX, e.g. submissions@insureinvestors.com).
 * The Azure app registration must have Mail.Send + Mail.Read application permission.
 */

type Attachment = {
  filename: string;
  content: Buffer | Uint8Array;
  contentType: string;
};

export type SendMailInput = {
  toEmails: string[];
  subject: string;
  body: string;
  /** Plain text by default; pass "HTML" if `body` is HTML. */
  bodyType?: "Text" | "HTML";
  replyTo?: string;
  attachments?: Attachment[];
};

export type SendMailResult = {
  /** Graph message id of the outbound. null if the post-send search couldn't find it. */
  messageId: string | null;
  /** Graph conversationId of the outbound. null if not found. */
  conversationId: string | null;
};

type GraphConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  fromMailbox: string;
};

function readConfig(): GraphConfig {
  const tenantId = process.env.GRAPH_TENANT_ID ?? "";
  const clientId = process.env.GRAPH_CLIENT_ID ?? "";
  const clientSecret = process.env.GRAPH_CLIENT_SECRET ?? "";
  const fromMailbox = process.env.GRAPH_FROM_MAILBOX ?? "";
  if (!tenantId || !clientId || !clientSecret || !fromMailbox) {
    throw new Error(
      "Microsoft Graph is not configured — set GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_FROM_MAILBOX in .env",
    );
  }
  return { tenantId, clientId, clientSecret, fromMailbox };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getGraphAccessToken(): Promise<string> {
  const cfg = readConfig();
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const tokenUrl = `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Graph token request failed (${res.status}): ${detail}`);
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) {
    throw new Error("Graph token response missing access_token");
  }
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

export function graphFromMailbox(): string {
  return readConfig().fromMailbox;
}

function toBase64(bytes: Buffer | Uint8Array): string {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return buf.toString("base64");
}

const DEV_FORWARD_TO = "alberto@insurecert.com";

function isDevMode(): boolean {
  const raw = (process.env.DEV ?? "").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Find the message we just sent in the Sent Items by subject. Graph indexes
 * messages with a small delay, so we retry a couple times.
 */
async function findSentMessage(
  token: string,
  mailbox: string,
  subject: string,
): Promise<{ id: string; conversationId: string } | null> {
  // ISO timestamp 5 minutes ago, no fractional seconds.
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString().split(".")[0] + "Z";
  const url =
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/messages` +
    `?$filter=sentDateTime gt ${since}` +
    `&$orderby=sentDateTime desc` +
    `&$top=10` +
    `&$select=id,conversationId,subject,sentDateTime`;

  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(2000);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) continue;
    const data = (await res.json()) as {
      value?: { id: string; conversationId: string; subject: string }[];
    };
    const match = (data.value ?? []).find((m) => m.subject === subject);
    if (match) return { id: match.id, conversationId: match.conversationId };
  }
  return null;
}

export async function sendMailViaGraph(
  input: SendMailInput,
): Promise<SendMailResult> {
  const cfg = readConfig();
  const token = await getGraphAccessToken();

  // In dev mode, redirect every send to a single sink address so we never
  // accidentally email real carriers while testing. Original recipients are
  // preserved in the subject line for audit.
  const dev = isDevMode();
  const toRecipients = dev ? [DEV_FORWARD_TO] : input.toEmails;
  const subject = dev
    ? `[DEV → ${input.toEmails.join(", ")}] ${input.subject}`
    : input.subject;

  const message: Record<string, unknown> = {
    subject,
    body: {
      contentType: input.bodyType ?? "Text",
      content: input.body,
    },
    toRecipients: toRecipients.map((address) => ({
      emailAddress: { address },
    })),
    from: { emailAddress: { address: cfg.fromMailbox } },
  };

  if (input.replyTo) {
    message.replyTo = [{ emailAddress: { address: input.replyTo } }];
  }

  if (input.attachments && input.attachments.length > 0) {
    message.attachments = input.attachments.map((a) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: a.filename,
      contentType: a.contentType,
      contentBytes: toBase64(a.content),
    }));
  }

  const sendUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(cfg.fromMailbox)}/sendMail`;
  const res = await fetch(sendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (res.status !== 202) {
    const detail = await res.text();
    throw new Error(`Graph sendMail failed (${res.status}): ${detail}`);
  }

  const found = await findSentMessage(token, cfg.fromMailbox, subject);
  return {
    messageId: found?.id ?? null,
    conversationId: found?.conversationId ?? null,
  };
}
