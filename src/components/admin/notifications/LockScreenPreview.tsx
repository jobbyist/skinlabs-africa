import { Bell } from "lucide-react";
import { previewText, type PreviewPlatform } from "@/lib/notificationAdmin";

const LABEL: Record<PreviewPlatform, string> = { ios: "iPhone", android: "Android", desktop: "Desktop" };

const frame: Record<PreviewPlatform, string> = {
  ios: "rounded-3xl bg-zinc-200/80 text-zinc-900 dark:bg-zinc-700/70 dark:text-zinc-50",
  android: "rounded-2xl bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50",
  desktop: "rounded-lg border border-border bg-background text-foreground shadow-md",
};

/** How the message reads on each OS. Approximate: the limits catch copy that would be cut off. */
const LockScreenPreview = ({ title, body }: { title: string; body: string }) => (
  <div className="grid gap-3 sm:grid-cols-3" aria-label="Notification previews">
    {(["ios", "android", "desktop"] as const).map((platform) => {
      const p = previewText(platform, title || "Your title", body || "Your message");
      return (
        <figure key={platform} data-testid={`preview-${platform}`} className="space-y-1.5">
          <figcaption className="text-xs font-medium text-muted-foreground">{LABEL[platform]}</figcaption>
          <div className={`flex items-start gap-2.5 p-3 ${frame[platform]}`}>
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background" aria-hidden="true">
              <Bell className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide opacity-60">SkinLabs® · now</p>
              <p className="text-sm font-semibold leading-snug">{p.title}</p>
              <p className="text-xs leading-snug opacity-80">{p.body}</p>
            </div>
          </div>
          {p.truncated && <p className="text-[11px] text-amber-600 dark:text-amber-400">Cut off on {LABEL[platform]}: shorten it.</p>}
        </figure>
      );
    })}
  </div>
);

export default LockScreenPreview;
