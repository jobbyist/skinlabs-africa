import { Button } from "@/components/ui/button";
import { GIVEAWAY_COPY } from "@/lib/giveaway/campaign";
import { trackGiveawayCta } from "@/lib/giveaway/analytics";

/** Example "My Skin Story" share image (1080 × 1920 from the Basic AI Skin Analysis, resized to 720 × 1280 WebP, 40 KB). */
export const GIVEAWAY_SKIN_STORY_IMAGE = "/giveaway/skin-story-example.webp";

/**
 * The example Skin Story people can share, with the entry button under it. A plain lazy image: no player, no
 * autoplay and nothing heavy to download.
 */
const GiveawaySkinStoryCard = ({ onEnter }: { onEnter: () => void }) => (
  <div className="mx-auto w-full max-w-[320px]">
    <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] border border-border bg-muted shadow-lg">
      <img
        src={GIVEAWAY_SKIN_STORY_IMAGE}
        alt="Example SkinLabs® Skin Story from the free Basic AI Skin Analysis: skin profile, core concerns, targeted actives and an AM and PM routine cue"
        width={720}
        height={1280}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
    <p className="mt-3 text-center text-xs text-muted-foreground">Example Skin Story. Yours is built from your own answers.</p>
    <div className="mt-4">
      <Button
        size="lg"
        className="h-12 w-full rounded-full"
        onClick={() => {
          trackGiveawayCta("story", "enter");
          onEnter();
        }}
      >
        {GIVEAWAY_COPY.enterCta}
      </Button>
    </div>
  </div>
);

export default GiveawaySkinStoryCard;
