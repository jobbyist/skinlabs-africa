/**
 * Build-time podcast RSS feed generator for The Skin Deep podcast, written
 * to public/podcast.xml (served at https://skinlabs.co.za/podcast.xml).
 * Standard RSS 2.0 + the iTunes namespace tags Apple Podcasts and Spotify
 * both read from a submitted feed URL.
 *
 * KNOWN GAP (see CLAUDE.md): there is no show-level artwork in this repo
 * that meets Apple/Spotify's minimum 1400x1400 SQUARE requirement. The best
 * available asset (public/podcast/ep-coming-soon.jpg, 1024x1024) is used as
 * a placeholder below — replace SHOW_IMAGE with real 3000x3000 artwork
 * before actually submitting this feed to Apple Podcasts Connect or
 * Spotify for Podcasters, or submission will likely be rejected on
 * artwork grounds. Per-episode itunes:image entries (in EPISODE_IMAGE
 * fallback usage) have the same issue: episode covers are 1080x1350
 * portrait, not square.
 */
import { statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { publishedPodcastEpisodes } from "../src/data/podcast";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SITE = "https://skinlabs.co.za";
const SHOW_IMAGE = `${SITE}/podcast/ep-coming-soon.jpg`;
const OWNER_EMAIL = "hello@skinlabs.co.za";
const PUBLISH_HOUR_UTC = "10:00:00"; // 12:00 SAST (UTC+2, no DST)

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const cdata = (value: string) => `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

/** RFC 822 pubDate, e.g. "Fri, 18 Sep 2026 10:00:00 GMT" — publishedAt is a
 * plain YYYY-MM-DD; the feed's actual publish slot is always 12:00 SAST. */
const toRfc822 = (isoDate: string): string => new Date(`${isoDate}T${PUBLISH_HOUR_UTC}Z`).toUTCString();

function main() {
  const episodes = publishedPodcastEpisodes
    .filter((ep) => ep.audioFile)
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const items = episodes.map((ep) => {
    const audioPath = resolve(root, "public", ep.audioFile.replace(/^\//, ""));
    let length = 0;
    try {
      length = statSync(audioPath).size;
    } catch {
      console.warn(`generate-podcast-rss: missing audio file for ${ep.slug}: ${audioPath}`);
    }
    const episodeUrl = `${SITE}/podcast/${ep.slug}`;
    const audioUrl = `${SITE}${ep.audioFile}`;
    const imageUrl = `${SITE}${ep.image}`;
    const showNotesHtml = ep.showNotes.length
      ? `<ul>${ep.showNotes.map((note) => `<li>${escapeXml(note)}</li>`).join("")}</ul>`
      : "";

    return `    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${cdata(ep.description)}</description>
      <content:encoded>${cdata(`<p>${ep.description}</p>${showNotesHtml}`)}</content:encoded>
      <link>${episodeUrl}</link>
      <guid isPermaLink="true">${episodeUrl}</guid>
      <pubDate>${toRfc822(ep.publishedAt)}</pubDate>
      <enclosure url="${audioUrl}" length="${length}" type="audio/mpeg" />
      <itunes:title>${escapeXml(ep.title)}</itunes:title>
      <itunes:summary>${cdata(ep.description)}</itunes:summary>
      <itunes:image href="${imageUrl}" />
      <itunes:duration>${ep.durationSeconds ?? 0}</itunes:duration>
      <itunes:episode>${ep.id}</itunes:episode>
      <itunes:season>1</itunes:season>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Skin Deep Podcast</title>
    <link>${SITE}/podcast</link>
    <atom:link href="${SITE}/podcast.xml" rel="self" type="application/rss+xml" />
    <language>en-za</language>
    <description>${cdata(
      "The Skin Deep is SkinLabs®'s audio series for evidence-first South African skincare conversations — ingredient science, skincare culture and routines, grounded in South African skin, climate and shelves. No affiliate deals, no gifted samples, no paid rankings.",
    )}</description>
    <itunes:summary>${cdata(
      "Evidence-first South African skincare conversations from SkinLabs® — ingredient science, skincare culture and routines, grounded in South African skin, climate and shelves.",
    )}</itunes:summary>
    <itunes:author>SkinLabs®</itunes:author>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>false</itunes:explicit>
    <itunes:image href="${SHOW_IMAGE}" />
    <image>
      <url>${SHOW_IMAGE}</url>
      <title>The Skin Deep Podcast</title>
      <link>${SITE}/podcast</link>
    </image>
    <itunes:category text="Health &amp; Fitness" />
    <itunes:owner>
      <itunes:name>SkinLabs®</itunes:name>
      <itunes:email>${OWNER_EMAIL}</itunes:email>
    </itunes:owner>
    <generator>SkinLabs podcast RSS generator</generator>
${items.join("\n")}
  </channel>
</rss>
`;

  writeFileSync(resolve(root, "public/podcast.xml"), rss, "utf-8");
  console.log(`generate-podcast-rss: wrote ${episodes.length} episodes to public/podcast.xml`);
  console.log(
    "generate-podcast-rss: WARNING — show artwork placeholder is 1024x1024 (public/podcast/ep-coming-soon.jpg), " +
      "below Apple/Spotify's 1400x1400 minimum. Replace SHOW_IMAGE with real square artwork before submitting to " +
      "Apple Podcasts Connect / Spotify for Podcasters.",
  );
}

main();
