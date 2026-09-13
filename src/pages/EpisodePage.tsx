import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import GatedOverlay from "@/components/GatedOverlay";
import ArticleComments from "@/components/ArticleComments";
import PodcastEngagementBar from "@/components/PodcastEngagementBar";
import AdSlot from "@/components/AdSlot";
import { usePodcastPlayer, formatTime } from "@/components/PodcastPlayer";
import { latestPublishedEpisode, podcastEpisodes, publishedPodcastEpisodes } from "@/data/podcast";
import { podcastComments } from "@/data/articleComments";
import { useMembership } from "@/hooks/use-membership";
import RelatedKnowledgeHub from "@/components/RelatedKnowledgeHub";
import { SITE_URL } from "@/lib/seo-config";

const EpisodePage = () => {
  const { slug } = useParams();
  const { playEpisode, current, progress } = usePodcastPlayer();
  const { isMember } = useMembership();
  const episode = podcastEpisodes.find((item) => item.slug === slug);
  const isCurrentEpisode = current?.slug === episode?.slug;
  const activeChapterSeconds = isCurrentEpisode
    ? [...(episode?.timestamps ?? [])].reverse().find((stamp) => progress >= stamp.seconds)?.seconds
    : undefined;
  const activeTranscriptSeconds = isCurrentEpisode
    ? [...(episode?.transcript ?? [])].reverse().find((line) => progress >= line.seconds)?.seconds
    : undefined;
  const activeLineRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeTranscriptSeconds]);

  if (!episode || episode.comingSoon) {
    const teaserImage = episode ? `${SITE_URL}${episode.image}` : undefined;
    return (
      <div className="min-h-screen bg-background">
        {episode && (
          <Helmet>
            <title>{`${episode.title} (Coming Soon) — The Skin Deep Podcast | SkinLabs`}</title>
            <meta name="description" content={episode.description} />
            <link rel="canonical" href={`https://skinlabs.co.za/podcast/${episode.slug}`} />
            <meta property="og:title" content={`${episode.title} — The Skin Deep Podcast`} />
            <meta property="og:description" content={episode.description} />
            <meta property="og:url" content={`https://skinlabs.co.za/podcast/${episode.slug}`} />
            <meta property="og:type" content="article" />
            {teaserImage && <meta property="og:image" content={teaserImage} />}
            {teaserImage && <meta property="og:image:alt" content={`${episode.title} cover art`} />}
            <meta name="twitter:card" content="summary_large_image" />
            {teaserImage && <meta name="twitter:image" content={teaserImage} />}
          </Helmet>
        )}
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {episode?.comingSoon ? "This episode is coming soon" : "Episode not found"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {episode?.comingSoon
              ? "We’re still recording. New episodes drop every Friday at 12pm SAST."
              : "That episode doesn’t exist or has been moved."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/podcast">Back to the podcast hub</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const socialImage = `${SITE_URL}${episode.image}`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${episode.title} — The Skin Deep Podcast | SkinLabs`}</title>
        <meta name="description" content={episode.description} />
        <link rel="canonical" href={`https://skinlabs.co.za/podcast/${episode.slug}`} />
        <meta property="og:title" content={`${episode.title} — The Skin Deep Podcast`} />
        <meta property="og:description" content={episode.description} />
        <meta property="og:url" content={`https://skinlabs.co.za/podcast/${episode.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={socialImage} />
        <meta property="og:image:alt" content={`${episode.title} cover art`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={socialImage} />
        <meta name="twitter:image:alt" content={`${episode.title} cover art`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "PodcastEpisode",
          name: episode.title,
          description: episode.description,
          image: socialImage,
          datePublished: episode.publishedAt,
          url: `https://skinlabs.co.za/podcast/${episode.slug}`,
        })}</script>
      </Helmet>

      <Header />
      <main className="pt-24 pb-28">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[320px_1fr]">
          <div>
            <img
              src={episode.image}
              alt={`${episode.title} cover art`}
              className="w-full rounded-3xl border border-border bg-muted object-contain"
            />
            <div className="mt-4">
              <PodcastEngagementBar episode={episode} onPlay={() => playEpisode(episode)} />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {episode.duration} · Published {episode.publishedAt}
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {episode.slug === latestPublishedEpisode?.slug && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                    New
                  </span>
                )}
                {episode.topics.map((topic) => (
                  <span key={topic} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {topic}
                  </span>
                ))}
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">{episode.title}</h1>
              <p className="mt-3 text-muted-foreground">{episode.description}</p>
            </div>

            <section>
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Show notes</h2>
              <ul className="space-y-2">
                {episode.showNotes.map((note) => (
                  <li key={note} className="flex gap-2 text-sm text-foreground">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground" />
                    {note}
                  </li>
                ))}
              </ul>
            </section>

            <AdSlot placement="episode-mid-1" compact />

            <section>
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Chapters</h2>
              <div className="divide-y divide-border rounded-2xl border border-border">
                {episode.timestamps.map((stamp) => {
                  const isActive = stamp.seconds === activeChapterSeconds;
                  return (
                    <button
                      key={stamp.time}
                      onClick={() => playEpisode(episode, stamp.seconds)}
                      aria-current={isActive ? "true" : undefined}
                      className={`flex w-full items-center gap-4 px-4 py-3 text-left text-sm hover:bg-accent ${
                        isActive ? "bg-accent" : ""
                      }`}
                    >
                      <span className="font-mono text-xs text-foreground">{stamp.time}</span>
                      <span className={isActive ? "font-semibold text-foreground" : "text-foreground"}>
                        {stamp.label}
                      </span>
                      {isActive && (
                        <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Playing
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <AdSlot placement="episode-mid-2" compact />

            {episode.productsMentioned.length > 0 && (
              <section>
                <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Products mentioned</h2>
                <div className="flex flex-wrap gap-2">
                  {episode.productsMentioned.map((product) => (
                    <Link
                      key={product.name}
                      to="/reviews"
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent"
                    >
                      {product.brand} — {product.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <RelatedKnowledgeHub keywords={episode.topics} />

            <AdSlot placement="episode-mid-3" compact />

            <section>
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Transcript</h2>
              <GatedOverlay
                locked={!isMember}
                title="Transcripts are member-only"
                message="Glow Insider and Glow VIP members get full transcripts and searchable show notes for every episode."
              >
                <div className="space-y-1">
                  {episode.transcript.map((line, index) => {
                    const isActive = line.seconds === activeTranscriptSeconds;
                    return (
                      <button
                        key={index}
                        ref={isActive ? activeLineRef : undefined}
                        type="button"
                        onClick={() => playEpisode(episode, line.seconds)}
                        aria-current={isActive ? "true" : undefined}
                        className={`flex w-full gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent ${
                          isActive ? "bg-accent" : ""
                        }`}
                      >
                        <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground">
                          {formatTime(line.seconds)}
                        </span>
                        <span
                          className={`text-sm leading-relaxed ${
                            isActive ? "font-medium text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {line.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </GatedOverlay>
            </section>

            <ArticleComments heading="Listener discussion" comments={podcastComments[episode.slug] ?? []} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EpisodePage;
