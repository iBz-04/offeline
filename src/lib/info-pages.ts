import type { ComponentType } from "react";
import { InfoCircledIcon } from "@econic";
import { Shield } from "@econic";

export type InfoSection = {
  title: string;
  paragraphs: string[];
};

export type InfoPageConfig = {
  menuLabel: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  sections: InfoSection[];
  lastUpdated?: string;
};

export const aboutPage: InfoPageConfig = {
  menuLabel: "About",
  title: "About Offeline",
  description: "Privacy-first AI that runs locally in your browser.",
  icon: InfoCircledIcon,
  sections: [
    {
      title: "What is Offeline?",
      paragraphs: [
        "Offeline is a privacy-first app for chatting with large and small language models on your own hardware. Inference runs in your browser or desktop app — your conversations stay on your device.",
        "You can embed documents, customize memory, and choose between WebGPU, Ollama, or llama.cpp backends depending on your setup.",
      ],
    },
    {
      title: "Built for privacy",
      paragraphs: [
        "Offeline is designed so you do not need to send prompts or files to a remote AI service. Models run locally, and your chat history is stored on your machine.",
      ],
    },
    {
      title: "Open source",
      paragraphs: [
        "Offeline is open source. You can inspect the code, contribute improvements, or run your own build.",
        "Created by Ibrahim Rayamah. Learn more at github.com/iBz-04/offeline.",
      ],
    },
  ],
};

export const privacyPage: InfoPageConfig = {
  menuLabel: "Privacy Policy",
  title: "Privacy Policy",
  description: "How Offeline handles your data.",
  icon: Shield,
  lastUpdated: "July 13, 2026",
  sections: [
    {
      title: "Local-first by design",
      paragraphs: [
        "Offeline runs AI models on your device. Prompts, responses, and embedded documents are processed locally and are not sent to Offeline servers for inference.",
      ],
    },
    {
      title: "Third-party services",
      paragraphs: [
        "Model files may be downloaded from public model hosts such as Hugging Face when you first load a model.",
        "The web version uses Google Analytics and Vercel Analytics to collect anonymous usage metrics. No chat content is included in these analytics.",
      ],
    },
    {
      title: "Your control",
      paragraphs: [
        "You can clear cached data and chat history at any time from Settings. Uninstalling the app or clearing site data removes locally stored information from your device.",
        "Because processing happens locally, you are responsible for backing up any conversations you want to keep.",
      ],
    },
    {
      title: "Contact",
      paragraphs: [
        "Questions about this policy can be directed to the project maintainer via the Offeline GitHub repository.",
      ],
    },
  ],
};
