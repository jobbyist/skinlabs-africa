import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { communityDb, mediaUrl, removeMedia, uploadMedia } from "@/lib/community/client";
import { ImageError, prepareAvatar } from "@/lib/community/image";
import { initialsOf } from "@/lib/community/rules";

/**
 * Profile picture. Cropped to a square on-device, re-encoded losslessly (see src/lib/community/image.ts) and stored in the
 * member's own folder of the public `avatars` bucket; profiles.avatar_path points at it. It is shown beside their username on
 * Community posts and comments, nowhere else, and removing it deletes the file.
 */
const AvatarUploader = ({ username }: { username: string }) => {
  const { user } = useAuth();
  const [path, setPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void Promise.resolve(communityDb.from("profiles").select("avatar_path").eq("user_id", user.id).maybeSingle()).then(({ data }) => {
      if (cancelled) return;
      setPath((data as { avatar_path?: string | null } | null)?.avatar_path ?? null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const save = async (next: string | null, previous: string | null) => {
    if (!user) return false;
    const { error } = await communityDb.from("profiles").update({ avatar_path: next }).eq("user_id", user.id);
    if (error) return false;
    setPath(next);
    if (previous) removeMedia("avatars", [previous]);
    return true;
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;
    setBusy(true);
    let uploaded: string | null = null;
    try {
      const prepared = await prepareAvatar(file);
      uploaded = await uploadMedia("avatars", user.id, prepared);
      if (await save(uploaded, path)) toast.success("Profile picture updated");
      else {
        removeMedia("avatars", [uploaded]);
        toast.error("We couldn't save your picture. Try again.");
      }
    } catch (e) {
      if (uploaded) removeMedia("avatars", [uploaded]);
      toast.error(e instanceof ImageError ? e.message : "We couldn't upload that picture. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      if (await save(null, path)) toast.success("Profile picture removed");
      else toast.error("We couldn't remove it. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const url = mediaUrl("avatars", path);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Profile picture</CardTitle>
        <CardDescription>Shown next to your username on Community posts and comments. Square-cropped on your device.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <span aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-xl font-semibold text-secondary-foreground">
          {url ? <img src={url} alt="" width={80} height={80} className="size-full object-cover" /> : initialsOf(username || "SkinLabs")}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy || !loaded} onClick={() => input.current?.click()} className="h-11">
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" /> : <Camera className="mr-2 size-4" aria-hidden="true" />}
            {path ? "Change picture" : "Upload a picture"}
          </Button>
          {path && (
            <Button type="button" variant="ghost" disabled={busy} onClick={remove} className="h-11 text-muted-foreground">
              <Trash2 className="mr-2 size-4" aria-hidden="true" /> Remove
            </Button>
          )}
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Choose a profile picture" onChange={onFile} />
        </div>
        <p className="w-full text-xs text-muted-foreground">JPEG, PNG or WebP. Location and camera data are never uploaded.</p>
      </CardContent>
    </Card>
  );
};

export default AvatarUploader;
