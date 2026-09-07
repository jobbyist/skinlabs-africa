import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, Building2, ChevronRight, Eye, EyeOff, Mail, MapPin, MessageCircle, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Dermatologist } from "@/data/dermatologists";
import { maskEmail, maskPhone } from "@/lib/mask-contact";
import { cn } from "@/lib/utils";

interface DermatologistCardProps {
  dermatologist: Dermatologist;
  index?: number;
}

const ContactRow = ({
  icon: Icon,
  value,
  masked,
  onToggle,
  revealed,
}: {
  icon: typeof Mail;
  value: string;
  masked: string;
  onToggle: () => void;
  revealed: boolean;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="inline-flex w-full items-center gap-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
    aria-label={revealed ? `Hide ${value}` : `Reveal contact detail`}
  >
    <Icon className="h-3.5 w-3.5 shrink-0" />
    <span className="truncate">{revealed ? value : masked}</span>
    {revealed ? <EyeOff className="h-3 w-3 shrink-0 opacity-60" /> : <Eye className="h-3 w-3 shrink-0 opacity-60" />}
  </button>
);

/** A single dermatologist/practice listing card for the /consult directory — matches the
 *  directory template's layout (avatar, verified badge, contact rows, Message / View Profile). */
const DermatologistCard = ({ dermatologist, index = 0 }: DermatologistCardProps) => {
  const [emailRevealed, setEmailRevealed] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const TypeIcon = dermatologist.practiceType === "practice" ? Building2 : UserRound;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: Math.min(index, 4) * 0.06 }}
        className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between md:p-6"
      >
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border"
          >
            <TypeIcon className="h-6 w-6" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-base font-bold text-foreground md:text-lg">{dermatologist.name}</h2>
              {dermatologist.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Unclaimed listing
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{dermatologist.role}</p>

            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {dermatologist.city}, {dermatologist.province}
            </p>

            <div className="mt-3 grid gap-1.5 sm:hidden">
              <ContactRow
                icon={Mail}
                value={dermatologist.email}
                masked={maskEmail(dermatologist.email)}
                revealed={emailRevealed}
                onToggle={() => setEmailRevealed((v) => !v)}
              />
              <ContactRow
                icon={Phone}
                value={dermatologist.phone}
                masked={maskPhone(dermatologist.phone)}
                revealed={phoneRevealed}
                onToggle={() => setPhoneRevealed((v) => !v)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <div className="hidden gap-1.5 sm:grid sm:min-w-[190px]">
            <ContactRow
              icon={Mail}
              value={dermatologist.email}
              masked={maskEmail(dermatologist.email)}
              revealed={emailRevealed}
              onToggle={() => setEmailRevealed((v) => !v)}
            />
            <ContactRow
              icon={Phone}
              value={dermatologist.phone}
              masked={maskPhone(dermatologist.phone)}
              revealed={phoneRevealed}
              onToggle={() => setPhoneRevealed((v) => !v)}
            />
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button asChild size="sm" className="flex-1 gap-1.5 sm:flex-none">
              <Link to={`/contact?practitioner=${dermatologist.id}`}>
                <MessageCircle className="h-3.5 w-3.5" /> Message
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-1 text-foreground sm:flex-none"
              onClick={() => setProfileOpen(true)}
            >
              View Profile <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border")}>
              <TypeIcon className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center font-heading text-xl">{dermatologist.name}</DialogTitle>
            <DialogDescription className="text-center">{dermatologist.role}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" /> {dermatologist.city}, {dermatologist.province}
            </p>
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" /> {dermatologist.email}
            </p>
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" /> {dermatologist.phone}
            </p>

            {dermatologist.verified ? (
              <p className="rounded-2xl bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                Contact details verified against public professional directory records.
              </p>
            ) : (
              <p className="rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
                This listing hasn't been claimed yet. Messages are routed through the SkinLabs partnerships
                team, who will forward your enquiry to the practice. Are you {dermatologist.name.replace(/^(Dr|Prof)\s/, "")}
                ? <Link to="/partners" className="font-medium text-foreground underline underline-offset-2">Claim this listing</Link>.
              </p>
            )}
          </div>

          <Button asChild className="w-full gap-1.5">
            <Link to={`/contact?practitioner=${dermatologist.id}`}>
              <MessageCircle className="h-4 w-4" /> Message this listing
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DermatologistCard;
