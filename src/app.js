import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPANY, POLICIES, INTENTS, ACTIONS, SAMPLES } from "./company.js";
import { AgentError, parseCaseRequest, MAX_MESSAGE_CHARS } from "./agent.js";
import { CONFIDENCE_THRESHOLD } from "./decision.js";

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

// The Process Agent widget on fizzl.eu calls the API from the browser.
export const DEFAULT_ORIGINS = ["https://fizzl.eu", "https://www.fizzl.eu", "https://ai.fizzl.eu", "https://cv.fizzl.eu", "https://projects.fizzl.eu"];

// Every case costs an API call, so the public demo is capped per visitor and
// per day. Per instance and in memory: a restart resets it, which is fine here.
export function createLimiter({ perIpPerHour = 10, perDay = 300, now = () => Date.now() } = {}) {
  const hits = new Map();
  let day = { start: now(), count: 0 };
  return function allow(ip) {
    const t = now();
    if (t - day.start >= 86_400_000) day = { start: t, count: 0 };
    if (day.count >= perDay) return { ok: false, reason: "The demo's daily limit is reached. Try again tomorrow." };
    const recent = (hits.get(ip) ?? []).filter((s) => t - s < 3_600_000);
    if (recent.length >= perIpPerHour) return { ok: false, reason: `Demo limit: ${perIpPerHour} cases per hour. Try again later.` };
    recent.push(t);
    hits.set(ip, recent);
    if (hits.size > 10_000) hits.delete(hits.keys().next().value);
    day.count++;
    return { ok: true };
  };
}

export function createApp({ processCase, limiter = createLimiter(), origins = DEFAULT_ORIGINS }) {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'",
    });
    next();
  });

  app.use("/api", (req, res, next) => {
    const origin = req.get("origin");
    if (origin && origins.includes(origin)) {
      res.set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      });
    }
    if (req.method === "OPTIONS") return res.sendStatus(origin && origins.includes(origin) ? 204 : 403);
    next();
  });

  app.get("/health", (_req, res) => res.json({ ok: true, service: "process-agent" }));

  app.get("/api/config", (_req, res) => res.json({
    company: COMPANY.name,
    policies: POLICIES,
    intents: INTENTS,
    actions: ACTIONS,
    samples: SAMPLES,
    confidenceThreshold: CONFIDENCE_THRESHOLD,
    limits: { message: MAX_MESSAGE_CHARS },
  }));

  app.post("/api/process-case", express.json({ limit: "16kb" }), async (req, res) => {
    try {
      const request = parseCaseRequest(req.body);
      const allowed = limiter(req.ip);
      if (!allowed.ok) return res.status(429).json({ error: allowed.reason });
      res.set("Cache-Control", "no-store").json(await processCase(request));
    } catch (err) {
      if (err instanceof AgentError) return res.status(err.status).json({ error: err.message });
      console.error("[process-case]", err);
      res.status(500).json({ error: "Something went wrong. Try again." });
    }
  });


  app.use(express.static(PUBLIC_DIR, { maxAge: "1h" }));
  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  return app;
}
