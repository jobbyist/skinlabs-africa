import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { CalendarClock, Languages, MapPin, Video } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import GatedOverlay from "@/components/GatedOverlay";
import { practitioners } from "@/data/practitioners";
import { useMembership } from "@/hooks/use-membership";

const Consultations = () => {
  const { isVip } = useMembership();

  return (
    <>
      <Helmet>
        <title>Virtual Derm Consultations — SA Practitioners | SkinLabs</title>
        <meta
          name="description"
          content="Book virtual skincare consultations with South African dermatologists and aesthetic practitioners. Rand pricing, local availability, included with Glow VIP membership."
        />
        <link rel="canonical" href="https://skinlabs.co.za/book-consultation" />
        <meta property="og:title" content="Virtual Derm Consultations — SA Practitioners | SkinLabs" />
        <meta property="og:description" content="Book virtual consultations with SA dermatologists and aesthetic practitioners." />
        <meta property="og:url" content="https://skinlabs.co.za/book-consultation" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-24">
          <div className="container mx-auto px-4">
            <div className="mb-10 max-w-2xl">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Virtual care</p>
              <h1 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">
                Talk to a real South African practitioner
              </h1>
              <p className="text-muted-foreground">
                Your AI routine gives you a plan. A virtual consultation confirms it. Book a video session with
                HPCSA-registered dermatologists and aesthetic practitioners — included monthly with Glow VIP.
              </p>
            </div>

            <GatedOverlay
              locked={!isVip}
              title="Booking is a Glow VIP benefit"
              message="Glow VIP members get one virtual consultation each month plus priority booking. Non-members can still browse availability."
              ctaLabel="Upgrade to Glow VIP"
            >
              <div className="grid gap-6 md:grid-cols-2">
                {practitioners.map((practitioner, index) => (
                  <motion.div
                    key={practitioner.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: (index % 2) * 0.08 }}
                    className="flex flex-col rounded-3xl border border-border bg-card p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-heading text-lg font-bold text-foreground">{practitioner.name}</h2>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {practitioner.credential}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                        R{practitioner.virtual_fee_zar}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground">{practitioner.bio}</p>

                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <p className="inline-flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" /> {practitioner.city}, {practitioner.province}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <Languages className="h-3.5 w-3.5" /> {practitioner.languages.join(", ")}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5" /> Next available: {practitioner.next_available}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {practitioner.specialities.map((speciality) => (
                        <span key={speciality} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          {speciality}
                        </span>
                      ))}
                    </div>

                    <Button className="mt-6 w-full gap-2" asChild>
                      <a href={`/contact?practitioner=${practitioner.id}`}>
                        <Video className="h-4 w-4" /> Request a booking
                      </a>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </GatedOverlay>

            <p className="mt-10 text-xs text-muted-foreground">
              Consultations are provided by independent HPCSA-registered practitioners. SkinLabs facilitates booking and
              does not provide medical diagnosis. Seek urgent in-person care for rapidly changing lesions or infection.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Consultations;
