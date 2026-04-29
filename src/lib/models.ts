export interface Model {
  name: string;
  displayName: string;
  badge?: string;
  badgeColor?: "red" | "yellow" | "green" | "blue";
  performance: "ultra-fast" | "fast" | "balanced" | "quality";
}

// Performance Color Legend:
// 🔴 Red = Ultra Fast (Speed optimized)
// 🟡 Yellow = Fast (Good speed)  
// 🟢 Green = Balanced (Speed + Quality)
// 🔵 Blue = Quality (Best responses)

// source is AppConfig
// https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
// Optimized for ultra-fast web inference
export const Models: Model[] = [
  // Latest generation models
  {
    name: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    displayName: "Omni O1",
    badge: "Ultra Fast",
    badgeColor: "red",
    performance: "ultra-fast",
  },
  {
    name: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    displayName: "Omni O2",
    badge: "Balanced",
    badgeColor: "green",
    performance: "balanced",
  },
  
  // Previous generation models
  {
    name: "Qwen2-0.5B-Instruct-q4f16_1-MLC",
    displayName: "Omni X1",
    badge: "Fast",
    badgeColor: "yellow",
    performance: "fast",
  },
  {
    name: "Qwen2-1.5B-Instruct-q4f32_1-MLC",
    displayName: "Omni X2",
    badge: "Quality",
    badgeColor: "blue",
    performance: "quality",
  },
];
