export type ModelPlatform = "mobile" | "desktop";

export interface Model {
  name: string;
  displayName: string;
  platform: ModelPlatform;
  badge?: string;
  badgeColor?: "red" | "yellow" | "green" | "blue";
  performance: "ultra-fast" | "fast" | "balanced" | "quality";
}

export const MobileModels: Model[] = [
  {
    name: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    displayName: "Qwen 2.5 0.5B",
    platform: "mobile",
    badge: "Ultra Fast",
    badgeColor: "red",
    performance: "ultra-fast",
  },
  {
    name: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    displayName: "Llama 3.2",
    platform: "mobile",
    badge: "Fast",
    badgeColor: "yellow",
    performance: "fast",
  },
  {
    name: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    displayName: "Qwen 2.5 1.5B",
    platform: "mobile",
    badge: "Balanced",
    badgeColor: "green",
    performance: "balanced",
  },
];

export const DesktopModels: Model[] = [
  {
    name: "Qwen2.5-3B-Instruct-q4f16_1-MLC",
    displayName: "Qwen 2.5 3B",
    platform: "desktop",
    badge: "Balanced",
    badgeColor: "green",
    performance: "balanced",
  },
  {
    name: "Qwen3-4B-q4f16_1-MLC",
    displayName: "Qwen 3",
    platform: "desktop",
    badge: "Quality",
    badgeColor: "blue",
    performance: "quality",
  },
];

export const Models: Model[] = [...MobileModels, ...DesktopModels];

export const DefaultModel = MobileModels[2];

export function findModelByName(name: string): Model | undefined {
  return Models.find((model) => model.name === name);
}
