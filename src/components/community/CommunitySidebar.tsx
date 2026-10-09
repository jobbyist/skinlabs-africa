import { useQuery } from "@tanstack/react-query";
import { BookOpen, Camera, HeartHandshake, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMMUNITY_KEY } from "@/hooks/use-community";
import { fetchOverview, fetchStaffList } from "@/lib/community/client";
import type { CommunityCategory } from "@/lib/community/rules";
import { AuthorAvatar, RoleBadge } from "./RoleBadge";

interface CommunitySidebarProps {
  categories: CommunityCategory[];
  category: string | null;
  onCategory: (slug: string | null) => void;
  onCompose: () => void;
  onGuidelines: () => void;
  canPost: boolean;
  /** Only fetch once the member is signed in. */
  enabled: boolean;
}

const FOCUS = "focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary";
const nf = new Intl.NumberFormat("en-ZA");

const Card = ({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) => (
  <section className={cn("rounded-2xl border border-border bg-card p-4", className)}>
    {title && <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>}
    {children}
  </section>
);

const Stat = ({ value, label }: { value: number; label: string }) => (
  <div className="min-w-0">
    <p className="font-heading text-lg font-bold tabular-nums leading-none tracking-tight text-foreground">{nf.format(value)}</p>
    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
  </div>
);

/**
 * Desktop right rail (lg and up): what the Community is, how to behave, who looks after it, and a topic filter.
 * Counts come from the database; if they can't be loaded the numbers are left out rather than estimated.
 */
const CommunitySidebar = ({ categories, category, onCategory, onCompose, onGuidelines, canPost, enabled }: CommunitySidebarProps) => {
  const overview = useQuery({ queryKey: [COMMUNITY_KEY, "overview"], queryFn: fetchOverview, enabled, staleTime: 5 * 60_000 });
  const staff = useQuery({ queryKey: [COMMUNITY_KEY, "staff-list"], queryFn: fetchStaffList, enabled, staleTime: 30 * 60_000 });
  const stats = overview.data;

  return (
    <aside aria-label="About this community" className="hidden space-y-4 lg:sticky lg:top-28 lg:block">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="gradient-bg h-10" aria-hidden="true" />
        <div className="space-y-3 p-4">
          <h2 className="font-heading text-base font-semibold tracking-tight">SkinLabs® Community</h2>
          <p className="text-sm leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Our mission: honest, kind and practical skin conversations for South African skin, sun, seasons and budgets.
          </p>
          {stats && (
            <dl className="grid grid-cols-3 gap-2 border-y border-border py-3" aria-label="Community activity">
              <Stat value={stats.member_count} label={stats.member_count === 1 ? "Member" : "Members"} />
              <Stat value={stats.discussions_today} label={stats.discussions_today === 1 ? "Discussion today" : "Discussions today"} />
              <Stat value={stats.replies_today} label={stats.replies_today === 1 ? "Reply today" : "Replies today"} />
            </dl>
          )}
          {canPost && (
            <Button className="w-full" onClick={onCompose}>
              Create a post
            </Button>
          )}
        </div>
      </div>

      <Card title="Posting etiquette">
        <ul className="space-y-2.5 text-sm leading-snug text-muted-foreground">
          <li className="flex gap-2.5">
            <Stethoscope className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden="true" />
            <span>Share experience, not diagnoses. For anything persistent, see a doctor or dermatologist.</span>
          </li>
          <li className="flex gap-2.5">
            <Camera className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden="true" />
            <span>Keep photos private: no faces of other people, names or contact details.</span>
          </li>
          <li className="flex gap-2.5">
            <HeartHandshake className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden="true" />
            <span>Be kind. No spam, self-promotion or unsafe advice.</span>
          </li>
        </ul>
        <button type="button" onClick={onGuidelines} className={cn("mt-3 inline-flex items-center gap-1.5 rounded text-sm font-medium text-foreground underline underline-offset-2", FOCUS)}>
          <BookOpen className="size-4" aria-hidden="true" /> Read the full guidelines
        </button>
      </Card>

      {staff.data && staff.data.length > 0 && (
        <Card title="Moderators">
          <ul className="space-y-2.5">
            {staff.data.map((s) => (
              <li key={`${s.role}-${s.display_name}`} className="flex items-center gap-2.5">
                <AuthorAvatar name={s.display_name} role={s.role} avatarPath={s.avatar_path} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{s.display_name}</span>
                <RoleBadge role={s.role} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Use “Report” on any post or comment to reach them.</p>
        </Card>
      )}

      <nav aria-label="Topics" className="rounded-2xl border border-border bg-card p-2">
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filter by topic</p>
        <div className="flex flex-wrap gap-1.5 p-1">
          {[{ slug: null as string | null, name: "All" }, ...categories].map((c) => (
            <button
              key={c.slug ?? "all"}
              type="button"
              aria-pressed={category === c.slug}
              onClick={() => onCategory(c.slug)}
              className={cn(
                "h-9 rounded-full border px-3.5 text-sm font-medium transition-colors",
                FOCUS,
                category === c.slug ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground/80 hover:border-foreground/30",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default CommunitySidebar;
