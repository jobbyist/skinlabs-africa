import {
  GIVEAWAY_CLOSING_TIME_LABEL,
  GIVEAWAY_CONTACT_EMAIL,
  GIVEAWAY_DEADLINE_LABEL,
  GIVEAWAY_LEGAL,
  GIVEAWAY_NAME,
  GIVEAWAY_PRIZES,
  GIVEAWAY_TIKTOK_HANDLE,
  GIVEAWAY_WINNER_ANNOUNCEMENT,
  type GiveawayLegalConfig,
} from "@/lib/giveaway/campaign";
import { BASIC_NAME, BASIC_WINDOW_DAYS } from "@/lib/skynn/terminology";

export interface TermsSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

/**
 * Giveaway Terms & Conditions, built from the campaign config. Facts the business hasn't supplied stay in
 * `GiveawayLegalConfig` as null: when null the copy falls back to a statement that is true whatever the answer
 * (never a made-up entity, age, territory or draw method), and when supplied the specific line appears automatically.
 * A unit test fails if placeholder text ("TODO", "TBC", "[...]") could reach the page.
 */
export const giveawayTermsSections = (legal: GiveawayLegalConfig = GIVEAWAY_LEGAL): TermsSection[] => {
  const promoter = legal.promoterLegalName
    ? `${legal.promoterLegalName}${legal.promoterRegistration ? ` (${legal.promoterRegistration})` : ""}, trading as SkinLabs®`
    : "SkinLabs®";

  return [
    {
      id: "about",
      title: "About this giveaway",
      paragraphs: [
        `The ${GIVEAWAY_NAME} is run by ${promoter} (“SkinLabs®”, “we”). It closes at ${GIVEAWAY_CLOSING_TIME_LABEL} on ${GIVEAWAY_DEADLINE_LABEL}. Entries that are not complete by then are not valid.`,
        "Entering is free. You do not have to buy anything. The free skin assessment and a free SkinLabs® account are all you need.",
      ],
    },
    {
      id: "eligibility",
      title: "Who can enter",
      paragraphs: ["To enter you need a SkinLabs® account, a TikTok account and the ability to accept the prizes described below. By entering you confirm that you are legally able to take part and to accept the prizes where you live."],
      bullets: [
        ...(legal.minimumAge !== null ? [`You must be ${legal.minimumAge} or older.`] : []),
        ...(legal.territory ? [`Open to: ${legal.territory}.`] : []),
        "SkinLabs® staff and anyone involved in running the giveaway cannot enter.",
      ],
    },
    {
      id: "how-to-enter",
      title: "How to enter",
      paragraphs: ["One entry per person. To make a valid entry you must do all four of these before the closing time:"],
      bullets: [
        `Complete the free ${BASIC_NAME} on SkinLabs® and save it to your account. (Free accounts can do one every ${BASIC_WINDOW_DAYS} days.)`,
        "Share your Skin Story on your TikTok Story.",
        `Tag ${GIVEAWAY_TIKTOK_HANDLE} in that Story.`,
        "Come back to the giveaway page, sign in and confirm your entry with your TikTok username.",
      ],
    },
    {
      id: "tiktok-story",
      title: "Your TikTok Story",
      paragraphs: [
        "Your Skin Story is yours to tell. It can be about your skin concerns, your journey, something you discovered or something you learned from your assessment. You do not have to say anything positive about SkinLabs® or claim that it improved your skin. An honest story is a valid story.",
        "We can’t check your TikTok Story automatically, so we do it by hand. Keep your Story live for as long as TikTok allows and confirm your entry soon after posting, so we can find it. If we can’t, we may ask you for a screenshot or screen recording of it. Your account needs to be public enough for us to see that you tagged us.",
      ],
    },
    {
      id: "prizes",
      title: "Prizes",
      paragraphs: [
        `There are ${GIVEAWAY_PRIZES.winners === 2 ? "two" : GIVEAWAY_PRIZES.winners} winners. Each winner receives one ${GIVEAWAY_PRIZES.voucher} and ${GIVEAWAY_PRIZES.subscription} access to SkinLabs®, so the total prize pool is two vouchers and two lifetime Glow Insider memberships. Taking part does not mean you will win. Not every participant receives a prize.`,
        ...(legal.lifetimeDefinition ? [`Lifetime Glow Insider: ${legal.lifetimeDefinition}`] : []),
        ...(legal.voucherExpiryNote ? [`Takealot voucher: ${legal.voucherExpiryNote}`] : []),
      ],
    },
    {
      id: "winners",
      title: "Choosing and contacting winners",
      paragraphs: [
        legal.winnerSelectionMethod
          ? `Winners are chosen from valid entries received before the closing time. ${legal.winnerSelectionMethod}`
          : "Winners are chosen from valid entries received before the closing time.",
        `Winners are announced ${GIVEAWAY_WINNER_ANNOUNCEMENT}${legal.winnerAnnouncementDate ? ` on ${legal.winnerAnnouncementDate}` : ""}, and contacted at the email address on their SkinLabs® account.`,
        "To receive a prize, a winner must give us the information we need to deliver it (for example, where to send the voucher).",
        legal.prizeClaimWindowDays !== null
          ? `If we can’t reach a winner, or they don’t respond within ${legal.prizeClaimWindowDays} days, we may choose another winner from the valid entries.`
          : "If we can’t reach a winner, or they don’t respond within a reasonable time, we may choose another winner from the valid entries.",
      ],
    },
    {
      id: "verification",
      title: "Checking entries",
      paragraphs: [
        "We check every entry before awarding a prize. We may disqualify an entry that is incomplete, late, a duplicate, made through more than one account, automated, manipulated or fraudulent, or that doesn’t follow these terms. Our decision on whether an entry is valid is final, subject to your rights under South African law.",
      ],
    },
    {
      id: "content",
      title: "Your content",
      paragraphs: [
        legal.ugcRepostLicence === true
          ? "By entering you allow SkinLabs® to view, verify and share your TikTok Story (with credit to you) on our own channels. You keep ownership of your content."
          : "By entering you allow SkinLabs® to view your TikTok Story to verify your entry. We will not repost or use your Story in advertising without asking you first. You keep ownership of your content.",
        "You confirm the Story is your own and doesn’t break TikTok’s rules or anyone else’s rights.",
      ],
    },
    {
      id: "privacy",
      title: "Your information",
      paragraphs: [
        "For the giveaway we use your SkinLabs® account email, your TikTok username and your entry confirmation, only to run the giveaway: checking entries, contacting winners and delivering prizes. We use your assessment only to confirm that you completed it.",
        "Your skin information, assessment answers and results are never sent to TikTok, Takealot or used to choose winners. Photos you add to the assessment stay on your device. Our TikTok advertising tools only run if you accepted advertising cookies.",
        "How we handle personal information, and how to ask for access or deletion, is in our Privacy Policy.",
      ],
    },
    {
      id: "ai",
      title: "About the free analysis",
      paragraphs: [
        `The free analysis is ${BASIC_NAME}: AI-powered skin insights based on your own answers. It provides general skincare guidance and is not medical advice or a diagnosis, and it doesn’t replace a dermatologist. If you are worried about your skin, see a qualified health professional.`,
      ],
    },
    {
      id: "third-parties",
      title: "TikTok and Takealot",
      paragraphs: [
        "This giveaway is not sponsored, administered, run or endorsed by TikTok or Takealot, and they are not responsible for it. You are giving your information to SkinLabs®, not to them.",
      ],
    },
    {
      id: "changes",
      title: "Changes and the law",
      paragraphs: [
        "Where the law allows, SkinLabs® may change these terms or cancel or suspend the giveaway if something outside our control makes it unfair or impossible to run. We will say so on this page. These terms are governed by the laws of South Africa.",
        `Questions about the giveaway? Email ${GIVEAWAY_CONTACT_EMAIL}.`,
      ],
    },
  ];
};
