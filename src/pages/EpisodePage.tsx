import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Play } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import GatedOverlay from "@/components/GatedOverlay";
import ArticleComments from "@/components/ArticleComments";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { podcastEpisodes } from "@/data/podcast";
import { podcastComments } from "@/data/articleComments";
import { useMembership } from "@/hooks/use-membership";

const EpisodePage = () => {
  const { slug } = useParams();
  const { playEpisode } = usePodcastPlayer();
  const { isMember } = useMembership();
  const episode = podcastEpisodes.find((item) => item.slug === slug);

  if (!episode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Episode not found</h1>
          <Button asChild className="mt-6">
            <Link to="/podcast">Back to the podcast hub</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

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
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "PodcastEpisode",
          name: episode.title,
          description: episode.description,
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
            <Button className="mt-4 w-full gap-2" onClick={() => playEpisode(episode)}>
              <Play className="h-4 w-4" /> Play episode
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {episode.duration} · Published {episode.publishedAt}
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
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
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {note}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Chapters</h2>
              <div className="divide-y divide-border rounded-2xl border border-border">
                {episode.timestamps.map((stamp) => (
                  <button
                    key={stamp.time}
                    onClick={() => playEpisode(episode, stamp.seconds)}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left text-sm hover:bg-accent"
                  >
                    <span className="font-mono text-xs text-primary">{stamp.time}</span>
                    <span className="text-foreground">{stamp.label}</span>
                  </button>
                ))}
              </div>
            </section>

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

            <section>
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Transcript</h2>
              <GatedOverlay
                locked={!isMember}
                title="Transcripts are member-only"
                message="Glow Insider and Glow VIP members get full transcripts and searchable show notes for every episode."
              >
                <div className="space-y-3">
                  {episode.transcript.map((line, index) => (
                    <p key={index} className="text-sm leading-relaxed text-muted-foreground">
                      {line}
                    </p>
                  ))}
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
