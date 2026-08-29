import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Atom } from "lucide-react";
import { featuredEditorials } from "@/data/editorials";

const Editorials = () => {
  const cards = featuredEditorials.slice(0, 3);

  return (
    <section id="editorials" className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Comparisons</p>
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              Shelf Showdown: our head-to-head comparisons
            </h2>
            <p className="text-muted-foreground">
              Two products, one shelf, no forced winner. Our Shelf Showdown series pits SA skincare against itself on
              actives, evidence and Rand value — so you know which one actually makes sense for your skin.
            </p>
          </div>
          <Link to="/compare" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline shrink-0">
            Browse all shelf showdowns
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((editorial, index) => (
            <motion.div
              key={editorial.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
            >
              <Link
                to={editorial.href}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-foreground/30"
              >
                <div className="relative">
                  <img
                    src={editorial.thumbnailUrl}
                    alt={editorial.thumbnailAlt}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                    {editorial.comingSoon ? (
                      "Coming soon"
                    ) : (
                      <>
                        <Atom className="h-3 w-3" /> Featured
                      </>
                    )}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                    {editorial.saContext}
                  </span>
                  <h3 className="font-heading text-base font-bold leading-snug text-foreground">{editorial.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{editorial.dek}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    {editorial.comingSoon ? "View details" : "Read the showdown"}{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Editorials;
