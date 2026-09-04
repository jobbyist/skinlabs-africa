/**
 * A stable, per-browser id used only to meter the free Daily Skinny briefing
 * allowance for signed-out visitors (mirrors how signed-in reads are counted
 * per user id). Not used for tracking, analytics or ads, and never sent
 * anywhere except the get_article_body RPC.
 */
const KEY = "skinlabs-anon-device-id";

export const getAnonDeviceId = (): string | null => {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};
