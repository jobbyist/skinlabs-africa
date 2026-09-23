import type { Story, StoryPage } from "./stories";

/**
 * Renders a Story as a standalone AMP Web Story document (amp-story 1.0) for
 * /web-stories/:slug — the format Google Discover and Search surface as
 * story carousels. Pure string rendering so it can be validated directly
 * with the official AMP validator; every interpolated value is escaped.
 */

export const SITE_URL = "https://skinlabs.co.za";
const PUBLISHER = "SkinLabs";
const PUBLISHER_LOGO = `${SITE_URL}/favicon.png`; // 512x512 square, per amp-story's publisher-logo requirement
const ADSENSE_CLIENT = "ca-pub-1237323355260727";
const ADSENSE_STORY_SLOT = "2940635869";

const AMP_BOILERPLATE =
  "<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>";

const AMP_CUSTOM_CSS = `
amp-story{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff}
.scrim{background:linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.35) 45%,rgba(0,0,0,0) 70%)}
.copy{align-content:end;padding:32px 24px 72px}
.copy h1,.copy h2{font-size:28px;line-height:1.15;font-weight:800;margin:0 0 12px}
.copy p{font-size:17px;line-height:1.45;margin:0;opacity:.92}
.disclosure{align-content:start;padding:56px 20px 0}
.disclosure span{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.04em;background:rgba(0,0,0,.55);border-radius:999px;padding:4px 10px}
`.trim();

export const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const absoluteUrl = (url: string): string => (url.startsWith("/") ? `${SITE_URL}${url}` : url);

/** Only stories that are real, standalone, multi-page content get an AMP page. */
export const isAmpEligible = (story: Story): boolean => story.source === "db" && story.pages.length >= 2;

const mediaLayer = (page: StoryPage, pageId: string): string => {
  const alt = escapeHtml(page.mediaAlt);
  if (page.mediaType === "video") {
    return `<amp-story-grid-layer template="fill"><amp-video id="${pageId}-video" autoplay width="720" height="1280" layout="responsive" poster="${escapeHtml(absoluteUrl(page.posterUrl ?? ""))}" title="${alt}"><source src="${escapeHtml(absoluteUrl(page.mediaUrl))}" type="video/mp4"></amp-video></amp-story-grid-layer>`;
  }
  return `<amp-story-grid-layer template="fill"><amp-img src="${escapeHtml(absoluteUrl(page.mediaUrl))}" width="720" height="1280" layout="responsive" alt="${alt}"></amp-img></amp-story-grid-layer>`;
};

const renderPage = (story: Story, page: StoryPage, index: number, isLast: boolean): string => {
  const pageId = `page-${index + 1}`;
  const advance = page.mediaType === "video" ? `${pageId}-video` : `${Math.round(page.durationMs / 1000)}s`;
  const heading = index === 0 ? "h1" : "h2";
  const copy =
    page.headline || page.body
      ? `<amp-story-grid-layer template="vertical" class="scrim copy">${page.headline ? `<${heading}>${escapeHtml(page.headline)}</${heading}>` : ""}${page.body ? `<p>${escapeHtml(page.body)}</p>` : ""}</amp-story-grid-layer>`
      : "";
  const disclosure = story.isSponsored
    ? `<amp-story-grid-layer template="vertical" class="disclosure"><span>Sponsored${story.sponsorName ? ` · ${escapeHtml(story.sponsorName)}` : ""}</span></amp-story-grid-layer>`
    : "";
  // amp-story disallows an outlink on the first page; the CTA lives on the last one.
  const outlink =
    isLast && index > 0 && story.ctaUrl
      ? `<amp-story-page-outlink layout="nodisplay"><a href="${escapeHtml(absoluteUrl(story.ctaUrl))}"${story.isSponsored ? ' rel="sponsored"' : ""}>${escapeHtml(story.ctaLabel || "Read more")}</a></amp-story-page-outlink>`
      : "";
  return `<amp-story-page id="${pageId}" auto-advance-after="${advance}">${mediaLayer(page, pageId)}${copy}${disclosure}${outlink}</amp-story-page>`;
};

const analyticsConfig = (story: Story, canonical: string) =>
  JSON.stringify({
    requests: {
      event: `${canonical}?event=\${storyEvent}&page=\${storyPageIndex}`,
    },
    triggers: {
      pageVisible: { on: "story-page-visible", request: "event", vars: { storyEvent: "page_view" } },
      lastPage: { on: "story-last-page-visible", request: "event", vars: { storyEvent: "complete" } },
    },
    transport: { beacon: true, xhrpost: true, image: false },
    extraUrlParams: { key: story.key },
  });

export const renderAmpStory = (story: Story): string => {
  const canonical = `${SITE_URL}/web-stories/${story.slug}`;
  const poster = escapeHtml(absoluteUrl(story.coverImageUrl));
  const title = escapeHtml(story.title);
  const description = escapeHtml(story.pages.find((p) => p.body)?.body ?? story.title);
  const hasVideo = story.pages.some((p) => p.mediaType === "video");
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    image: [absoluteUrl(story.coverImageUrl)],
    datePublished: story.publishAt,
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: PUBLISHER, url: SITE_URL },
    publisher: { "@type": "Organization", name: PUBLISHER, logo: { "@type": "ImageObject", url: PUBLISHER_LOGO } },
  }).replace(/</g, "\\u003c");
  const pages = story.pages.map((page, i) => renderPage(story, page, i, i === story.pages.length - 1)).join("");

  return `<!doctype html>
<html amp lang="en">
<head>
<meta charset="utf-8">
<title>${title} | ${PUBLISHER} Stories</title>
<link rel="canonical" href="${canonical}">
<meta name="viewport" content="width=device-width">
<meta name="description" content="${description}">${story.kind === "promotional" ? '\n<meta name="robots" content="noindex">' : ""}
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:image" content="${poster}">
<meta property="og:url" content="${canonical}">
${AMP_BOILERPLATE}
<script async src="https://cdn.ampproject.org/v0.js"></script>
<script async custom-element="amp-story" src="https://cdn.ampproject.org/v0/amp-story-1.0.js"></script>
<script async custom-element="amp-story-auto-ads" src="https://cdn.ampproject.org/v0/amp-story-auto-ads-0.1.js"></script>
<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>${hasVideo ? '\n<script async custom-element="amp-video" src="https://cdn.ampproject.org/v0/amp-video-0.1.js"></script>' : ""}
<style amp-custom>${AMP_CUSTOM_CSS}</style>
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<amp-story standalone title="${title}" publisher="${PUBLISHER}" publisher-logo-src="${PUBLISHER_LOGO}" poster-portrait-src="${poster}">
<amp-story-auto-ads><script type="application/json">${JSON.stringify({ "ad-attributes": { type: "adsense", "data-ad-client": ADSENSE_CLIENT, "data-ad-slot": ADSENSE_STORY_SLOT } })}</script></amp-story-auto-ads>
<amp-analytics><script type="application/json">${analyticsConfig(story, canonical)}</script></amp-analytics>
${pages}
</amp-story>
</body>
</html>
`;
};
