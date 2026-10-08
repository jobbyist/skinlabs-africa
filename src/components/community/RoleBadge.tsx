import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { mediaUrl } from "@/lib/community/client";
import { initialsOf, roleLabel, type CommunityRole } from "@/lib/community/rules";

/** Understated role marker. The word is always shown, so it never relies on colour alone. */
export const RoleBadge = ({ role, className }: { role: CommunityRole; className?: string }) => {
  const label = roleLabel(role);
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-foreground/80",
        className,
      )}
      title={role === "admin" ? "SkinLabs® admin" : "SkinLabs® community moderator"}
    >
      <ShieldCheck className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
};

/** Profile picture when the member has one (public avatars bucket), otherwise their initials. */
export const AuthorAvatar = ({ name, role, avatarPath, size = "md" }: { name: string; role: CommunityRole; avatarPath?: string | null; size?: "sm" | "md" }) => {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : mediaUrl("avatars", avatarPath);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-semibold text-secondary-foreground",
        role !== "member" && "ring-2 ring-foreground/15",
        size === "md" ? "size-10" : "size-8 text-[11px]",
      )}
    >
      {url ? (
        <img src={url} alt="" width={40} height={40} loading="lazy" decoding="async" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
};
