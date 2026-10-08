import { useCallback, useRef, useState } from "react";
import CommentHandleDialog from "@/components/comments/CommentHandleDialog";
import { useCommentHandle } from "@/hooks/use-comment-handle";

/**
 * Posting needs a public handle (the database refuses without one: `handle_required`). `ensure()` resolves true straight
 * away when the member has one, otherwise opens the same one-time handle dialog the review comments use and resolves
 * once it is saved (false if dismissed). Render `dialog` once.
 */
export const useRequireHandle = (userId: string | null | undefined) => {
  const { handle, loading, saveHandle } = useCommentHandle(userId);
  const [open, setOpen] = useState(false);
  const waiting = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    waiting.current?.(ok);
    waiting.current = null;
  }, []);

  const ensure = useCallback(
    () =>
      handle
        ? Promise.resolve(true)
        : new Promise<boolean>((resolve) => {
            waiting.current = resolve;
            setOpen(true);
          }),
    [handle],
  );

  const dialog = (
    <CommentHandleDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) settle(false);
      }}
      saveHandle={saveHandle}
      onSaved={() => {
        setOpen(false);
        settle(true);
      }}
    />
  );

  return { ensure, dialog, handleLoading: loading };
};
