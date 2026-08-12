import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Play, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePodcastPlayer } from "@/components/PodcastPlayer";
import { getNextEpisodeDate, podcastEpisodes, podcastTopics } from "@/data/podcast";
import { cn } from "@/lib/utils";

const PodcastPage = () => {
  const { playEpisode, current } = usePodcastPlayer();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");

  const episodes = useMemo(() => {
    return podcastEpisodes.filter((episode) => {
      const matchesTopic = topic === "All" || episode.topics.includes(topic);
      const haystack = `${episode.title} ${episode.description} ${episode.topics.join(" ")}`.toLowerCase();
      return matchesTopic && haystack.includes(query.toLowerCase());
    });
  }, [query, topic]);

  const nextDrop = getNextEpisodeDate().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>The Skin Deep Podcast — SA Skincare Conversations | SkinLabs</title>
        <meta
          name="description"
          content="Stream The Skin Deep Podcast: weekly South African skincare conversations, ingredient science breakdowns and show notes with timestamps."
        />
        <link rel="canonical" href="https://skinlabs.co.za/stream" />
        <meta property="og:title" content="The Skin Deep Podcast | SkinLabs" />
        <meta property="og:description" content="Weekly SA skincare conversations and ingredient science breakdowns." />
        <meta property="og:url" content="https://skinlabs.co.za/stream" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "PodcastSeries",
          name: "The Skin Deep Podcast",
          url: "https://skinlabs.co.za/stream",
          description: "Weekly South African skincare conversations and ingredient science breakdowns.",
        })}</script>
      </Helmet>

      <Header />
      <main className="pt-24 pb-28">
        <section className="container mx-auto px-4">
          <div className="mb-10 max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Audio series</p>
            <h1 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">The Skin Deep Podcast</h1>
            <p className="text-muted-foreground">
              Weekly conversations on skincare culture, ingredient science and mindful routines — grounded in South
              African skin, climate and shelves. New episode every {nextDrop}.
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search episodes"
                className="pl-9"
                aria-label="Search episodes"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", ...podcastTopics].map((item) => (
                <button
                  key={item}
                  onClick={() => setTopic(item)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm transition-colors",
                    topic === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {episodes.map((episode, index) => (
              <motion.article
                key={episode.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: (index % 3) * 0.06 }}
                whileHover={{ y: -4 }}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-3xl border bg-card",
                  current?.id === episode.id ? "border-primary" : "border-border",
                )}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={episode.image}
                    alt={`${episode.title} cover art`}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                  <button
                    onClick={() => playEpisode(episode)}
                    aria-label={`Play ${episode.title}`}
                    className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                  >
                    <Play className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {episode.duration}
                    </span>
                    {episode.topics.map((item) => (
                      <span key={item} className="rounded-full bg-muted px-2.5 py-0.5">
                        {item}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-heading text-lg font-bold text-foreground">{episode.title}</h2>
                  <p className="text-sm text-muted-foreground">{episode.description}</p>
                  <Button asChild variant="link" className="mt-auto justify-start px-0">
                    <Link to={`/stream/${episode.slug}`}>Show notes & transcript →</Link>
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>

          {episodes.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">No episodes match that search yet.</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PodcastPage;
