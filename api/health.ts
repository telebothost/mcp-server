/**
 * Vercel serverless endpoint: GET /api/health  →  JSON health probe.
 *
 * Lightweight JSON endpoint for uptime monitoring, load balancer checks,
 * and programmatic introspection.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateHealthJson } from "../lib/docs.js";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = (req.headers["x-forwarded-host"] as string) ?? (req.headers["host"] as string) ?? "localhost";
  const origin = `${proto}://${host}`;

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(generateHealthJson(origin));
}
