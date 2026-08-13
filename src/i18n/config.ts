import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import af from "./locales/af.json";

// Foundation for EN/AF support: covers site chrome (header, footer, hero,
// features, pricing, FAQ). Newsroom/Reviews/Podcast content and AI-generated
// recommendations stay English-only for now — machine-translating
// dermatology-adjacent copy without professional review risks accuracy
// problems in health-adjacent content, so that's a deliberate follow-up,
// not an oversight.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      af: { translation: af },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "af"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "skinlabs-language",
    },
  });

export default i18n;
