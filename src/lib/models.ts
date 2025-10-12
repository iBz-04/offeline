export interface Model {
  name: string;
  displayName: string;
  badge?: string;
}

// source is AppConfig
// https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
// Optimized for ultra-fast web inference - Qwen models only
export const Models: Model[] = [
  // QWEN 2.5 SERIES (Latest & Fastest)
  {
    name: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    displayName: "Qwen2.5 0.5B ⚡ (Ultra Fast)",
    badge: "Fastest",
  },
  {
    name: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    displayName: "Qwen2.5 1.5B ⚡⚡ (Very Fast)",
    badge: "Recommended",
  },
  
  // QWEN 2 SERIES (Proven & Reliable)
  {
    name: "Qwen2-0.5B-Instruct-q4f16_1-MLC",
    displayName: "Qwen2 0.5B (Ultra Fast)",
  },
  {
    name: "Qwen2-1.5B-Instruct-q4f32_1-MLC",
    displayName: "Qwen2 1.5B (Very Fast)",
  },
];
