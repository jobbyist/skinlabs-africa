// Real official logos for reviewed brands and SA retailers, sourced from
// each company's own public site — used for factual product/retailer
// identification in an independent comparison review (nominative fair use),
// never fabricated. Entries with no reliably-sourced logo are omitted on
// purpose; BrandMark falls back to a clean text badge for those.
import clicksLogo from "@/assets/retailers/clicks.png";
import dischemLogo from "@/assets/retailers/dischem.png";
import takealotLogo from "@/assets/retailers/takealot.png";
import dermastoreLogo from "@/assets/retailers/dermastore.png";

import skoonLogo from "@/assets/brands/skoon.png";
import swiitchLogo from "@/assets/brands/swiitch.png";
import standardBeautyLogo from "@/assets/brands/standard-beauty.png";
import leliveLogo from "@/assets/brands/lelive.png";
import ohLiefLogo from "@/assets/brands/oh-lief.png";

export const retailerLogos: Record<string, string> = {
  Clicks: clicksLogo,
  "Dis-Chem": dischemLogo,
  Takealot: takealotLogo,
  Dermastore: dermastoreLogo,
  // "Brand Direct" isn't a real retailer (sold directly by the brand) and
  // "Faithful to Nature" has no reliably-sourced official asset — both
  // intentionally omitted, BrandMark renders a text badge for these.
};

export const brandLogos: Record<string, string> = {
  "Skoon Skin": skoonLogo,
  "Swiitch Beauty": swiitchLogo,
  "Standard Beauty": standardBeautyLogo,
  Lelive: leliveLogo,
  "Oh-Lief": ohLiefLogo,
  "Dermastore Select": dermastoreLogo, // Dermastore's own private label
};
