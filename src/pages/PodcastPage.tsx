import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Play, Pause, Search, SkipBack, SkipForward, Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePodcastPlayer, formatTime } from "@/components/PodcastPlayer";
import { getNextEpisodeDate, podcastEpisodes, podcastTopics, publishedPodcastEpisodes } from "@/data/podcast";
import { matchScore } from "@/lib/search-index";
import { cn } from "@/lib/utils";
import { usePodcastEngagement } from "@/hooks/use-podcast-engagement";
import AffiliateBanner from "@/components/AffiliateBanner";
import AdSlot from "@/components/AdSlot";

const PodcastPage = () => {
  const { playEpisode, current, isPlaying, toggle, progress, duration, speed, skip, cycleSpeed, seek } =
    usePodcastPlayer();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const engagement = usePodcastEngagement(publishedPodcastEpisodes);

  const episodes = useMemo(() => {
    const byTopic = podcastEpisodes.filter(
      (episode) => topic === "All" || episode.topics.includes(topic) || episode.comingSoon,
    );
    if (!query.trim()) return byTopic;
    return byTopic
      .map((episode) => ({
        episode,
        score: matchScore(
          query,
          episode.title,
          `${episode.description} ${episode.topics.join(" ")} ${episode.productsMentioned.map((p) => `${p.brand} ${p.name}`).join(" ")}`,
        ),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.episode);
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
          content="Stream The Skin Deep Podcast: evidence-first South African skincare conversations, ingredient science breakdowns and show notes. New episodes on the last Friday of every month. Coming soon to all major podcast platforms."
        />
        <link rel="canonical" href="https://skinlabs.co.za/podcast" />
        <meta property="og:title" content="The Skin Deep Podcast | SkinLabs" />
        <meta property="og:description" content="Evidence-first SA skincare conversations. New episodes on the last Friday of every month." />
        <meta property="og:url" content="https://skinlabs.co.za/podcast" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Header />
      <main className="pt-24 pb-28">
        <section className="container mx-auto px-4">
          <div className="mb-8">
            <AdSlot placement="podcast-top" compact />
          </div>
          <div className="mb-10 max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Audio series</p>
            <h1 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">The Skin Deep Podcast</h1>
            <p className="text-muted-foreground">
              Skincare without the nonsense. Conversations on ingredient science, culture and routines — grounded in
              South African skin, climate and shelves. New episodes uploaded on the last Friday of every month. Coming
              soon to all major podcast streaming platforms.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Next drop around {nextDrop}.</p>
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
            {episodes.map((episode, index) => {
              const isCurrent = current?.id === episode.id;
              const isComingSoon = Boolean(episode.comingSoon);
              const pct = isCurrent && duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;
              const timeLeft = isCurrent ? formatTime(progress) : "0:00";
              const timeTotal =
                isCurrent && duration > 0 ? formatTime(duration) : episode.duration.replace(" min", ":00");

              return (
                <motion.article
                  key={episode.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: (index % 3) * 0.06 }}
                  whileHover={{ y: isComingSoon ? 0 : -4 }}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm",
                    isCurrent ? "border-foreground/30" : "border-border",
                  )}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={episode.image}
                      alt={`${episode.title} cover art`}
                      loading="lazy"
                      className={cn(
                        "h-full w-full object-cover transition-transform duration-500",
                        !isComingSoon && "group-hover:scale-105",
                        isComingSoon && "opacity-90",
                      )}
                    />

                    {isComingSoon ? (
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-background/90 px-4 py-5 backdrop-blur-md">
                        <span className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                          Coming soon
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-border/60 bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur-md">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              void engagement.recordPlay(episode);
                              if (isCurrent) toggle();
                              else playEpisode(episode);
                            }}
                            aria-label={isCurrent && isPlaying ? `Pause ${episode.title}` : `Play ${episode.title}`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
                          >
                            {isCurrent && isPlaying ? (
                              <Pause className="h-4 w-4 fill-current" />
                            ) : (
                              <Play className="h-4 w-4 fill-current" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              className="h-1 w-full overflow-hidden rounded-full bg-muted"
                              aria-label="Seek"
                              onClick={(e) => {
                                if (!isCurrent || duration <= 0) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                                seek(ratio * duration);
                              }}
                            >
                              <div
                                className="h-full rounded-full bg-foreground transition-[width] duration-150"
                                style={{ width: `${pct}%` }}
                              />
                            </button>
                            <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                              <span>{timeLeft}</span>
                              <span>{timeTotal}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center justify-center gap-4 text-[10px] font-medium text-muted-foreground">
                          <button type="button" onClick={() => isCurrent && skip(-15)} disabled={!isCurrent} className="inline-flex items-center gap-0.5 hover:text-foreground disabled:opacity-40">
                            <SkipBack className="h-3 w-3" /> 15 SEC
                          </button>
                          <button type="button" onClick={() => isCurrent && cycleSpeed()} disabled={!isCurrent} className="hover:text-foreground disabled:opacity-40">
                            {isCurrent ? `${speed}x` : "1x"} SPEED
                          </button>
                          <button type="button" onClick={() => isCurrent && skip(15)} disabled={!isCurrent} className="inline-flex items-center gap-0.5 hover:text-foreground disabled:opacity-40">
                            15 SEC <SkipForward className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
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
                    <p className="text-sm text-muted-foreground line-clamp-3">{episode.description}</p>
                    {engagement.isAuthenticated && !isComingSoon && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="tabular-nums">{engagement.getPlays(episode).toLocaleString()} plays</span>
                        <button type="button" onClick={() => void engagement.toggleLike(episode)} className="inline-flex items-center gap-1 hover:text-foreground">
                          <Heart className={`h-3.5 w-3.5 ${engagement.isLiked(episode.slug) ? "fill-foreground text-foreground" : ""}`} />
                          {engagement.getLikes(episode).toLocaleString()}
                        </button>
                      </div>
                    )}
                    {!isComingSoon && (
                      <Button asChild variant="link" className="mt-auto justify-start px-0 text-foreground">
                        <Link to={`/podcast/${episode.slug}`}>Show notes & transcript →</Link>
                      </Button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>

          {episodes.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">No episodes match that search yet.</p>
          )}
        </section>
      </main>
      <div className="container mx-auto px-4 pb-10">
        <AffiliateBanner placement="podcast-bottom" />
      </div>
      <Footer />
    </div>
  );
};

export default PodcastPage;
