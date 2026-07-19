/**
 * Vercel serverless endpoint: GET /api/health  →  JSON health probe.
 *
 * Lightweight JSON endpoint for uptime monitoring, load balancer checks,
 * and programmatic introspection.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateHealthJson, resolveRequestOrigin } from "../lib/docs.js";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const origin = resolveRequestOrigin(req.headers);

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(generateHealthJson(origin));
}
