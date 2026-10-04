import { useEffect, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { canShareLink, copyStoryLink, downloadStory, shareStoryLink } from "@/lib/skynn/share-my-skin-story";

interface MySkinStoryDialogProps {
  /** The generated PNG. The dialog is open exactly while this is set. */
  blob: Blob | null;
  skinType: string;
  onClose: () => void;
}

/**
 * Fallback for browsers without native file sharing: a 9:16 preview of the card
 * with Download / Copy link. The preview's object URL lives only while open.
 */
const MySkinStoryDialog = ({ blob, skinType, onClose }: MySkinStoryDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
    };
  }, [blob]);

  const handleDownload = () => {
    if (!blob) return;
    downloadStory(blob);
    toast.success("Your skin story is downloading");
  };

  const handleCopy = async () => {
    const ok = await copyStoryLink();
    if (ok) toast.success("Link copied — paste it anywhere");
    else toast.error("We couldn't copy the link. You can share skinlabs.co.za/skynn-ai instead.");
  };

  return (
    <Dialog open={blob !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95dvh] w-[calc(100%-2rem)] max-w-md gap-4 overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-heading">My Skin Story</DialogTitle>
          <DialogDescription>Your story is ready. Save it and post it to WhatsApp, Instagram or TikTok.</DialogDescription>
        </DialogHeader>

        <div className="mx-auto w-full max-w-[min(100%,calc((95dvh-17rem)*9/16))] min-w-[160px]">
          <div className="aspect-[9/16] overflow-hidden rounded-xl border border-border bg-muted shadow-md">
            {previewUrl && (
              <img
                src={previewUrl}
                alt={`Your SkinLabs skin story: ${skinType} skin profile with your core concerns and targeted actives`}
                className="h-full w-full object-contain"
                draggable={false}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleDownload} className="min-h-11 gap-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            Download Story Image
          </Button>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={handleCopy} className="min-h-11 gap-2">
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy Share Link
            </Button>
            {canShareLink() && (
              <Button variant="outline" onClick={() => void shareStoryLink()} className="min-h-11 gap-2">
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MySkinStoryDialog;
