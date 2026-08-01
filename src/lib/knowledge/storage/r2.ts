import "server-only";
import { createHmac, createHash } from "node:crypto";
import { AdapterError } from "@/lib/knowledge/adapters/types";

/**
 * Minimal S3-compatible client for Cloudflare R2 (or any SigV4 S3 API).
 * Stores original file snapshots; Postgres keeps only objectKey.
 */

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new AdapterError(
      `Missing ${name}. Configure R2/S3 env vars for object storage uploads.`,
      false,
      "storage_unconfigured",
    );
  }
  return v;
}

export function isObjectStorageConfigured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID ||
      process.env.S3_ENDPOINT ||
      process.env.R2_ENDPOINT,
  ) &&
    Boolean(process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID) &&
    Boolean(process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY) &&
    Boolean(process.env.R2_BUCKET || process.env.S3_BUCKET);
}

function storageConfig() {
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID!;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_BUCKET || process.env.S3_BUCKET!;
  const region = process.env.R2_REGION || process.env.S3_REGION || "auto";
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.R2_ENDPOINT ||
    process.env.S3_ENDPOINT ||
    (accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : undefined);
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    requiredEnv("R2_ENDPOINT");
  }
  return {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
    region,
    endpoint: endpoint!.replace(/\/$/, ""),
  };
}

function hmac(key: Buffer | string, data: string) {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: Buffer | string) {
  return createHash("sha256").update(data).digest("hex");
}

function amzDate(d = new Date()) {
  return d.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function signV4(params: {
  method: string;
  path: string;
  query?: string;
  headers: Record<string, string>;
  body: Buffer | string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  service?: string;
}) {
  const service = params.service ?? "s3";
  const now = amzDate();
  const date = now.slice(0, 8);
  const payloadHash = sha256Hex(params.body);
  const headers: Record<string, string> = {
    ...params.headers,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": now,
  };
  const signedHeaderKeys = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort();
  const canonicalHeaders = signedHeaderKeys
    .map((k) => {
      const original = Object.keys(headers).find((h) => h.toLowerCase() === k)!;
      return `${k}:${headers[original]!.trim()}\n`;
    })
    .join("");
  const signedHeaders = signedHeaderKeys.join(";");
  const canonicalRequest = [
    params.method,
    params.path,
    params.query ?? "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${date}/${params.region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    now,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const kDate = hmac(`AWS4${params.secretAccessKey}`, date);
  const kRegion = hmac(kDate, params.region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning)
    .update(stringToSign, "utf8")
    .digest("hex");
  headers.Authorization = `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return headers;
}

export async function putObject(params: {
  key: string;
  body: Buffer;
  contentType?: string;
}) {
  const cfg = storageConfig();
  const path = `/${cfg.bucket}/${params.key.replace(/^\//, "")}`;
  const url = `${cfg.endpoint}${path}`;
  const headers = signV4({
    method: "PUT",
    path,
    headers: {
      host: new URL(cfg.endpoint).host,
      "content-type": params.contentType || "application/octet-stream",
      "content-length": String(params.body.length),
    },
    body: params.body,
    region: cfg.region,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
  });
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: new Uint8Array(params.body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AdapterError(
      `Object storage PUT failed (${res.status}): ${text.slice(0, 200)}`,
      true,
      "storage_put_failed",
    );
  }
  return { objectKey: params.key.replace(/^\//, "") };
}

export async function getObject(key: string): Promise<{
  body: Buffer;
  contentType?: string;
}> {
  const cfg = storageConfig();
  const path = `/${cfg.bucket}/${key.replace(/^\//, "")}`;
  const url = `${cfg.endpoint}${path}`;
  const headers = signV4({
    method: "GET",
    path,
    headers: { host: new URL(cfg.endpoint).host },
    body: "",
    region: cfg.region,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
  });
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    throw new AdapterError(
      `Object storage GET failed (${res.status}) for key ${key}`,
      true,
      "storage_get_failed",
    );
  }
  const ab = await res.arrayBuffer();
  return {
    body: Buffer.from(ab),
    contentType: res.headers.get("content-type") ?? undefined,
  };
}

export function buildUploadKey(params: {
  userId: string;
  knowledgePackId: string;
  filename: string;
}) {
  const safe = params.filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  return `knowledge/${params.userId}/${params.knowledgePackId}/${Date.now()}_${safe}`;
}
