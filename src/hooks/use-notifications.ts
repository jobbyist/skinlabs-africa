import { useCallback, useEffect, useId, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SW_EVENTS } from "@/lib/pwa/serviceWorker";
import { INBOX_COLUMNS, INBOX_PAGE_SIZE, NOTIFICATIONS_CHANGED_EVENT, mergeRow, toInboxRow, unreadOf, visibleRows, type InboxRow } from "@/lib/notificationInbox";

export type NotificationRow = InboxRow;

const announceChange = () => {
  try {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  } catch {
    /* non-browser */
  }
};

/**
 * The dashboard inbox's notification feed. Every row is written server-side (account-event triggers and the
 * notification engine); nothing is fabricated client-side. Archived and expired rows are hidden. A realtime
 * subscription adds new rows (and applies archive/read changes from other devices) without a refresh, and a
 * "push-received" message from the service worker (a push arrived while the app was open) refetches.
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.id ?? null;
  // Two components use this hook at once (the dashboard tab badge and the Inbox). supabase.channel(name) returns the SAME
  // channel for the same name, and handlers added after it has joined never receive events, so each instance gets its own.
  const instance = useId();
  const latest = useRef<InboxRow[]>([]);
  latest.current = notifications;

  const load = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("notifications")
      .select(INBOX_COLUMNS)
      .eq("user_id", userId)
      .is("archived_at", null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(INBOX_PAGE_SIZE);
    setNotifications(visibleRows((data ?? []) as InboxRow[]));
    setLoading(false);
    announceChange();
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const apply = (payload: { new: unknown }) => {
      const row = toInboxRow(payload.new);
      if (row) {
        setNotifications((prev) => mergeRow(prev, row));
        announceChange();
      }
    };
    const channel = supabase
      .channel(`notifications-${userId}-${instance}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, apply)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, apply)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, instance]);

  // A push arrived while the app was open (the worker skips the system notification): refresh the feed.
  useEffect(() => {
    const onPush = () => void load();
    window.addEventListener(SW_EVENTS.pushReceived, onPush);
    return () => window.removeEventListener(SW_EVENTS.pushReceived, onPush);
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? now } : n)));
    announceChange();
    await supabase.from("notifications").update({ read_at: now }).eq("id", id).is("read_at", null);
    announceChange();
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    announceChange();
    const { error } = await supabase.rpc("mark_all_notifications_read");
    if (error) await load();
    announceChange();
    return !error;
  }, [load]);

  const archive = useCallback(
    async (id: string) => {
      const before = latest.current;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      announceChange();
      const { error } = await supabase.from("notifications").update({ archived_at: new Date().toISOString() }).eq("id", id);
      if (error) setNotifications(before);
      announceChange();
      return !error;
    },
    [],
  );

  const unreadCount = unreadOf(notifications);

  return { notifications, loading, unreadCount, markRead, markAllRead, archive, refresh: load };
};
