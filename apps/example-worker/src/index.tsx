import type { Ai } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { html } from "hono/html";

type Bindings = {
  AI: Ai;
  ASSETS: any;
  VITE_DEV_SERVER_URL?: string;
};

/**
 * Hono application that:
 *  1. In dev mode: proxies / to a Vite dev server (for HMR support)
 *  2. In production: serves static assets from ASSETS binding
 *  3. Lets Vite (during `npm run dev`) or the static-asset handler serve
 *     asset/module requests ("/src/...", "/@vite/...", files with an extension, etc.)
 *  4. Renders the HTML shell for top-level navigation requests.
 *
 * This keeps the dev server working with HMR while still allowing us to add
 * API routes under `/api/*` or any other backend logic.
 */
const app = new Hono<{ Bindings: Bindings }>();

// Simple JSON API for demo
app.get("/api", (c) => c.json({ name: "Example API" }));
app.get("/api/", (c) => c.json({ name: "Example API" }));

// Serve everything - either proxy to Vite in dev mode or serve static assets
app.all("*", async (c) => {
  const viteDevServerUrl = c.env.VITE_DEV_SERVER_URL || "";

  // If VITE_DEV_SERVER_URL is set, proxy to it
  if (c.env.VITE_DEV_SERVER_URL) {
    const url = new URL(c.req.url);
    url.protocol = new URL(viteDevServerUrl).protocol;
    url.host = new URL(viteDevServerUrl).host;
    const res = await fetch(url.toString(), {
      method: c.req.method,
      headers: c.req.raw.headers,
      body:
        c.req.method !== "GET" && c.req.method !== "HEAD"
          ? await c.req.text()
          : undefined,
    });
    return res;
  }
  // In production, serve static assets or render HTML shell
  if (!c.env.ASSETS) {
    return c.text("ASSETS binding not available", 500);
  }

  const { pathname } = new URL(c.req.url);

  // Simple heuristic: if the path starts with typical asset prefixes or has a
  // file-extension, hand it off to the next handler (Vite / other routes).
  // Note: /api/* routes are already handled above, so we don't need to check for them here
  const isAssetRequest =
    pathname.startsWith("/src/") ||
    pathname.startsWith("/@vite/") ||
    /\.[\w]+$/.test(pathname);

  if (isAssetRequest) return c.notFound();

  // For root, serve static index.html
  const response = await c.env.ASSETS.fetch(
    new Request(new URL("/index.html", c.req.url)),
  );
  return response;
});

export default app;
