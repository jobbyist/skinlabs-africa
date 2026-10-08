import { Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GuidelinesContent, { GUIDELINES_EFFECTIVE } from "./GuidelinesContent";

/** The Community Guidelines in a scrollable popup, so reading them never takes a member away from the forum. */
const GuidelinesDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex max-h-[88dvh] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl">
      <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left sm:px-6">
        <DialogTitle className="flex items-center gap-2 font-heading text-xl">
          <Users className="size-5 text-primary" aria-hidden="true" /> Community Guidelines
        </DialogTitle>
        <DialogDescription>Effective {GUIDELINES_EFFECTIVE}. A short read that keeps this a kind, useful place.</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6" tabIndex={0} aria-label="Community Guidelines text">
        <GuidelinesContent />
      </div>
    </DialogContent>
  </Dialog>
);

export default GuidelinesDialog;
