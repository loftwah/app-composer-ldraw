// Live release gate for LDraw's public search and sharing contract.
// The same head inspection runs locally in scripts/seo.mjs; this module adds
// real HTTP delivery, crawler user agents and the exact share-card bytes.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  canonical,
  inspectHead,
  origin as reviewedOrigin,
  shareAlt,
  shareHeight,
  sharePath,
  shareType,
  shareWidth,
} from "./seo.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function verifySeo({
  origin = reviewedOrigin,
  publicOrigin = origin,
  imageBytes,
  cacheHeaders = true,
  fetchImpl = fetch,
} = {}) {
  const image = publicOrigin + sharePath;
  const imageUrl = origin + sharePath;
  const records = [];
  const agents = [
    "Twitterbot/1.0",
    "facebookexternalhit/1.1",
    "LinkedInBot/1.0",
    "Googlebot",
  ];
  for (const agent of agents) {
    for (const path of ["/", "/?qa=seo"]) {
      const response = await fetchImpl(origin + path, {
        headers: { "User-Agent": agent },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      assert.equal(response.status, 200, agent + " " + path);
      const robotsHeader = response.headers.get("x-robots-tag") || "";
      assert(!/noindex/i.test(robotsHeader), "public page is noindex");
      assert.match(
        response.headers.get("content-security-policy") || "",
        /default-src 'self'/,
        "the public page must keep its CSP",
      );
      const html = await response.text();
      const record = inspectHead(html, {
        canonical: canonical,
        image,
        siteName: "LDraw",
      });
      assert.equal(record.canonical, canonical);
      records.push({ agent, path, title: record.title });
    }
    const response = await fetchImpl(imageUrl, {
      headers: { "User-Agent": agent },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    assert.equal(response.status, 200, agent + " share card");
    assert.equal(
      response.headers.get("content-type")?.split(";")[0],
      shareType,
    );
    if (cacheHeaders)
      assert.match(
        response.headers.get("cache-control") || "",
        /public.*max-age=\d+/,
        "the share card must be publicly cacheable",
      );
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.toString("hex", 0, 8), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), shareWidth);
    assert.equal(bytes.readUInt32BE(20), shareHeight);
    assert(bytes.length < 5 * 1024 * 1024);
    assert.equal(sha(bytes), sha(imageBytes), agent + " pixels drifted");
  }
  const robots = await fetchImpl(origin + "/robots.txt", {
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  assert.equal(robots.status, 200);
  const robotsText = await robots.text();
  assert.match(robotsText, /User-agent: \*\s+Allow: \//);
  assert(robotsText.includes("Sitemap: " + publicOrigin + "/sitemap.xml"));
  const sitemap = await fetchImpl(origin + "/sitemap.xml", {
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get("content-type") || "", /xml/);
  const xml = await sitemap.text();
  assert.deepEqual(
    [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]),
    [canonical],
  );
  const missing = await fetchImpl(origin + "/not-a-page-seo-check", {
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  assert.equal(missing.status, 404, "unknown paths must keep a real 404");
  const alt = await fetchImpl(origin + "/", {
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  assert(alt.ok);
  return {
    records,
    image,
    imageBytes: imageBytes.length,
    imageSha256: sha(imageBytes),
    shareAlt,
    robots: true,
    sitemap: true,
    real404: true,
    providerCacheRenderingVerified: false,
  };
}
