import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { recordCompleted } from "@/lib/context";
import { bindLedgerToUser, updateLedger } from "@/lib/context/ledgerStore";
import { notifyMemberContextChanged } from "@/lib/context/changeEvent";

/**
 * Renders nothing. Opening a released Advanced result completes the "Review my skin
 * intelligence" action, so Home moves on to the next step (updating the routine) instead
 * of asking again. Local, per account, and presentation-only.
 */
const MarkResultViewed = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    bindLedgerToUser(user.id);
    updateLedger((l) => recordCompleted(l, "advanced_review", new Date().toISOString()));
    notifyMemberContextChanged();
  }, [user]);
  return null;
};

export default MarkResultViewed;
