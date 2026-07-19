/**
 * Vercel serverless endpoint: GET /docs  →  Documentation page (alias for /).
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateDocsHtml, resolveRequestOrigin } from "../lib/docs.js";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const origin = resolveRequestOrigin(req.headers);

  const html = generateDocsHtml(origin);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
  res.status(200).send(html);
}
