import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, Loader2, MapPin } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNewsArticles } from "@/hooks/use-news-articles";

/** Live Daily Skinny briefings, real editorial content — not a fabricated activity feed. */
const NewsfeedCarousel = () => {
  const { articles, loading } = useNewsArticles(8);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (articles.length === 0) {
    return <p className="text-sm text-muted-foreground">No briefings published yet — check back soon.</p>;
  }

  return (
    <Carousel opts={{ align: "start", loop: false }} className="w-full">
      <CarouselContent className="-ml-3">
        {articles.map((article) => (
          <CarouselItem key={article.id} className="basis-[85%] pl-3 sm:basis-[45%] lg:basis-[30%]">
            <Link
              to={`/briefings/${article.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {article.cover_image_url ? (
                  <img
                    src={article.cover_image_url}
                    alt={article.cover_image_alt || article.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-accent to-muted" />
                )}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur">
                  <MapPin className="h-2.5 w-2.5" /> {article.sa_context_tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {article.reading_time}
                </span>
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{article.title}</h3>
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary">
                  Read <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="mt-3 flex items-center justify-end gap-2">
        <CarouselPrevious className="static translate-y-0" />
        <CarouselNext className="static translate-y-0" />
      </div>
    </Carousel>
  );
};

export default NewsfeedCarousel;
