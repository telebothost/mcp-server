/**
 * Vercel serverless endpoint: GET /  →  Documentation page.
 *
 * Serves a beautiful, responsive HTML docs page at the root URL.
 * Pre-fills the deployed origin from the request's Host header.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateDocsHtml } from "../lib/docs.js";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  // Reconstruct origin from request headers (works behind Vercel's CDN)
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = (req.headers["x-forwarded-host"] as string) ?? (req.headers["host"] as string) ?? "localhost";
  const origin = `${proto}://${host}`;

  const html = generateDocsHtml(origin);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
  res.status(200).send(html);
}
