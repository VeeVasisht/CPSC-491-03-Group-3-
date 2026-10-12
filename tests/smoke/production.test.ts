import { describe, expect, it } from "vitest";

const baseUrl =
  process.env.SMOKE_BASE_URL ?? "https://wetravel-569a0.web.app";

const site = new URL(baseUrl);
if (site.protocol !== "https:") {
  throw new Error("Smoke tests require an HTTPS production URL");
}

async function get(path: string): Promise<Response> {
  // Do not follow redirects silently: a login redirect can conceal a broken route.
  return fetch(new URL(path, site), {
    redirect: "manual",
    headers: { "Cache-Control": "no-cache" },
    signal: AbortSignal.timeout(10_000),
  });
}

async function loadHome() {
  const response = await get("/");
  const html = await response.text();
  return { response, html };
}

describe("Production deployment smoke tests", () => {
  it("serves the home page successfully", async () => {
    const { response } = await loadHome();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/text\/html/i);
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

  it("serves the JavaScript bundle referenced by the deployed page", async () => {
    const { html } = await loadHome();

    // React Router v7 references its client entry through modulepreload.
    const match = html.match(
      /<link\b[^>]*rel=["']modulepreload["'][^>]*href=["']([^"']*entry\.client[^"']*\.js)["']/i,
    );

    expect(
      match,
      "Expected a React Router client entry point in the deployed HTML",
    ).not.toBeNull();

    const assetUrl = new URL(match![1], site);

    // Ensure the referenced asset belongs to our Firebase deployment.
    expect(assetUrl.origin).toBe(site.origin);

    const response = await fetch(assetUrl);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/javascript/i);

    const javascript = await response.text();

    expect(javascript.length).toBeGreaterThan(0);
  });

  // Add only confirmed, public routes here. SPA rewrites can return HTTP 200
  // for nonexistent routes, so this is a reachability check, not route rendering.
  it.each(["/"])("responds to public route %s", async (path) => {
    const response = await get(path);
    expect(response.status).toBe(200);
  });
});
