/** A small, curated emoji set for the composer (no dependency). Grouped for the picker tabs. */
export interface EmojiGroup {
  id: string;
  label: string;
  icon: string;
  emojis: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: "faces",
    label: "Smileys",
    icon: "😊",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🙂", "😊", "😍", "🥰", "😘", "😎", "🤩", "🤔", "😬", "🙄", "😴", "😌", "🥺", "😢", "😭", "😤", "😮", "🤯", "🥲", "😇", "🤗"],
  },
  {
    id: "skin",
    label: "Skincare",
    icon: "🧴",
    emojis: ["🧴", "✨", "💧", "🌞", "☀️", "🌿", "🍃", "🧼", "🫧", "💆‍♀️", "💆‍♂️", "🧖‍♀️", "🧖‍♂️", "🪞", "🌸", "🍋", "🥒", "🍯", "🥥", "🌱", "🧪", "🔬", "🩹", "💊"],
  },
  {
    id: "hands",
    label: "Hands & hearts",
    icon: "👍",
    emojis: ["👍", "👎", "👏", "🙌", "🙏", "🤝", "💪", "👌", "🤞", "✌️", "🫶", "👋", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💖", "💗", "💯"],
  },
  {
    id: "weather",
    label: "Weather & nature",
    icon: "🌤️",
    emojis: ["🌤️", "⛅", "🌧️", "❄️", "🔥", "💨", "🌬️", "🌈", "🌊", "🏖️", "🏔️", "🌵", "🌻", "🌹", "🌴", "🍂", "🌙", "⭐", "🌍", "🦁", "🐘", "🦓", "🇿🇦", "🎉"],
  },
];

/** Inserts `emoji` into `text` at the selection (or the end), returning the new text and caret position. */
export const insertAtSelection = (text: string, emoji: string, start: number | null, end: number | null, max: number): { text: string; caret: number } => {
  const s = start ?? text.length;
  const e = end ?? s;
  const next = text.slice(0, s) + emoji + text.slice(e);
  if (next.length > max) return { text, caret: s };
  return { text: next, caret: s + emoji.length };
};
