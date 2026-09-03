/**
 * Homepage hero background videos. One is chosen at random on every page load
 * (see Hero.tsx) so returning visitors don't see the same loop every time.
 * All remote clips are free-to-use stock footage from Pexels (Pexels License —
 * free for commercial use, no attribution required: pexels.com/license), served
 * directly from Pexels' own CDN rather than bundled, since only one plays per visit.
 */
export interface HeroVideo {
  id: string;
  url: string;
  description: string;
}

/**
 * The 19 remote clips. Hero.tsx prepends the locally bundled brand video (a Vite
 * asset import, so it can't live in this plain data file) to make 20 in total.
 */
export const remoteHeroVideos: HeroVideo[] = [
  { id: "pexels-8131881", url: "https://videos.pexels.com/video-files/8131881/8131881-uhd_2160_4096_25fps.mp4", description: "Woman applying serum to her face" },
  { id: "pexels-8131891", url: "https://videos.pexels.com/video-files/8131891/8131891-uhd_2160_4096_25fps.mp4", description: "Close-up of serum application" },
  { id: "pexels-7291773", url: "https://videos.pexels.com/video-files/7291773/7291773-uhd_3840_2160_25fps.mp4", description: "Skincare and makeup products flat lay" },
  { id: "pexels-7754395", url: "https://videos.pexels.com/video-files/7754395/7754395-hd_1080_1920_30fps.mp4", description: "Beauty products arranged on shelves" },
  { id: "pexels-2383531", url: "https://videos.pexels.com/video-files/2383531/2383531-hd_1920_1080_24fps.mp4", description: "Macro water droplets on green leaves" },
  { id: "pexels-9721926", url: "https://videos.pexels.com/video-files/9721926/9721926-uhd_4096_1742_25fps.mp4", description: "Water dripping from rocks" },
  { id: "pexels-5210325", url: "https://videos.pexels.com/video-files/5210325/5210325-uhd_3840_2160_24fps.mp4", description: "Water droplets falling from a leaf" },
  { id: "pexels-5661975", url: "https://videos.pexels.com/video-files/5661975/5661975-hd_1920_1080_30fps.mp4", description: "Water droplets on a leaf" },
  { id: "pexels-6953532", url: "https://videos.pexels.com/video-files/6953532/6953532-hd_1920_1080_25fps.mp4", description: "Aloe vera plant in a vase" },
  { id: "pexels-8094080", url: "https://videos.pexels.com/video-files/8094080/8094080-hd_1920_1080_30fps.mp4", description: "Close-up of aloe vera plants" },
  { id: "pexels-6768508", url: "https://videos.pexels.com/video-files/6768508/6768508-uhd_4096_2160_30fps.mp4", description: "Essential oil diffuser close-up" },
  { id: "pexels-3762991", url: "https://videos.pexels.com/video-files/3762991/3762991-uhd_3840_2160_25fps.mp4", description: "Woman washing her face" },
  { id: "pexels-5979935", url: "https://videos.pexels.com/video-files/5979935/5979935-uhd_2160_4096_24fps.mp4", description: "Woman in the shower" },
  { id: "pexels-5264408", url: "https://videos.pexels.com/video-files/5264408/5264408-uhd_3840_2160_25fps.mp4", description: "Woman applying sunscreen to her arm" },
  { id: "pexels-5264406", url: "https://videos.pexels.com/video-files/5264406/5264406-uhd_3840_2160_25fps.mp4", description: "Person applying sunscreen" },
  { id: "pexels-5927936", url: "https://videos.pexels.com/video-files/5927936/5927936-hd_1080_1920_25fps.mp4", description: "Close-up of woman applying face cream" },
  { id: "pexels-8141588", url: "https://videos.pexels.com/video-files/8141588/8141588-uhd_2160_4096_25fps.mp4", description: "Close-up of woman applying toner" },
  { id: "pexels-8995580", url: "https://videos.pexels.com/video-files/8995580/8995580-uhd_2160_3840_25fps.mp4", description: "Woman doing her skincare routine" },
  { id: "pexels-3763029", url: "https://videos.pexels.com/video-files/3763029/3763029-uhd_3840_2160_25fps.mp4", description: "Woman with healthy, glowing skin" },
];

export const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
