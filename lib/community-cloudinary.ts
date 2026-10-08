import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

function config() {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new Error("Cloudinary is not configured. Add its cloud name, API key and secret in Vercel.");
  return { cloud, key, secret };
}

function sign(params: Record<string, string>, secret: string) {
  return createHash("sha1").update(`${Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&")}${secret}`).digest("hex");
}

export function uploadSignature(slug: string, kind: "gallery" | "coverage" | "covers") {
  const { cloud, key, secret } = config();
  const folder = `dr-kulwant/community-initiatives/${slug}/${kind}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  return { cloud, apiKey: key, folder, timestamp, signature: sign({ folder, timestamp }, secret) };
}

export function verifyUploadResponse(publicId: string, version: number, signature: string) {
  const expected = sign({ public_id: publicId, version: String(version) }, config().secret);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature || "", "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function destroyCloudinary(publicId: string, resourceType: string) {
  const { cloud, key, secret } = config();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign({ public_id: publicId, timestamp }, secret);
  const body = new URLSearchParams({ public_id: publicId, timestamp, api_key: key, signature });
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/destroy`, { method: "POST", body, cache: "no-store" });
  const result = await response.json();
  if (!response.ok || !["ok", "not found"].includes(result.result)) throw new Error("Cloudinary could not remove this file. Please try again.");
}
