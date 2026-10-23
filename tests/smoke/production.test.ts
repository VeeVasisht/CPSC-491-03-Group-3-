import { describe, expect, it } from "vitest";

const baseUrl = process.env.SMOKE_BASE_URL ?? "https://wetravel-569a0.web.app";

const site = new URL(baseUrl);
if (site.protocol !== "https:") {
  throw new Error("Smoke tests require an HTTPS production URL");
}

const htmlHeaders = {
  "Accept-Encoding": "identity",
  Accept: "text/html",
};

async function get(
  path: string,
  headers: Record<string, string> = {},
): Promise<Response> {
  // Do not follow redirects silently: a login redirect can conceal a broken route.
  return fetch(new URL(path, site), {
    redirect: "manual",
    headers: { "Cache-Control": "no-cache", ...headers },
    signal: AbortSignal.timeout(10_000),
  });
}

async function loadHome() {
  const response = await get("/", htmlHeaders);
  const html = await response.text();
  return { response, html };
}

describe("Production deployment smoke tests", () => {
  it("reports deployment response headers", async () => {
    const response = await fetch(site, {
      headers: {
        "Accept-Encoding": "identity",
        Accept: "text/html",
      },
    });

    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));
    console.log("Content-Encoding:", response.headers.get("content-encoding"));
    console.log("Content-Length:", response.headers.get("content-length"));

    expect(response.ok).toBe(true);
  });

  it("returns a valid React Router HTML document", async () => {
    const { html } = await loadHome();

    expect(html).toMatch(/<!doctype html>/i);
    expect(html).toMatch(/<html\b/i);
    expect(html).toMatch(/<head\b/i);
    expect(html).toMatch(/<body\b/i);

    // Verify that React Router's client-side runtime is initialized.
    expect(html).toContain("window.__reactRouterContext");
  });

  it("serves the home page successfully", async () => {
    const { response, html } = await loadHome();

    // Verify that Firebase Hosting returns a successful response.
    expect(response.status).toBe(200);

    // Verify that the response contains an HTML document.
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).toMatch(/<html\b/i);
  });

  // Add only confirmed, public routes here. SPA rewrites can return HTTP 200
  // for nonexistent routes, so this is a reachability check, not route rendering.
  it.each(["/"])("responds to public route %s", async (path) => {
    const response = await get(path);
    expect(response.status).toBe(200);
  });
});
