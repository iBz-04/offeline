import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { WebLLMProvider } from "@/providers/web-llm-provider";
import { OllamaProvider } from "@/providers/ollama-provider";
import { LlamaCppProvider } from "@/providers/llama-cpp-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";
import { LoadingScreenWrapper } from "@/components/loading-screen-wrapper";
import { ElectronLayoutWrapper } from "@/components/electron-layout-wrapper";

import { default as fav } from "./favicon.ico";

const metainfo = {
  name: "OmniBot",
  title: "OmniBot",
  description: "Chat with llm models offline and in your browser",
  url: "https://www.omnibot.chat/",
  icons: {
    icon: [
      { rel: "icon", url: fav.src },
      { rel: "icon", type: "image/png", url: "/fav-32x32.png" }
    ],
  },
  image: "https://res.cloudinary.com/diekemzs9/image/upload/v1732472018/dark_wljsy8.png",
};

export const metadata: Metadata = {
  metadataBase: new URL(metainfo.url),
  title: {
    default: metainfo.name,
    template: "%s - " + metainfo.name,
  },
  description: metainfo.description,
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", type: "image/png", url: "/fav-32x32.png" }
  ],
  authors: [
    {
      name: "Ibrahim Rayamah",
      url: "https://www.ibz04.pro/",
    },
  ],
  openGraph: {
    type: "website",
    title: metainfo.name,
    url: metainfo.url,
    description: metainfo.description,
    images: [metainfo.image],
    siteName: metainfo.name,
  },
  twitter: {
    card: "summary_large_image",
    site: metainfo.url,
    title: metainfo.name,
    description: metainfo.description,
    images: [metainfo.image],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Configure Transformers.js to use Hugging Face CDN
              if (typeof window !== 'undefined') {
                window.transformersConfig = {
                  allowLocalModels: false,
                  allowRemoteModels: true,
                };
              }
            `,
          }}
        />
      </head>
      <body className={GeistSans.className}>
        <LoadingScreenWrapper>
          <LlamaCppProvider>
            <OllamaProvider>
              <WebLLMProvider>
                <ThemeProvider attribute="class" defaultTheme="system">
                  <ElectronLayoutWrapper>
                    <Suspense>
                      {children}
                    </Suspense>
                  </ElectronLayoutWrapper>
                  <Toaster position="top-right" />
                </ThemeProvider>
              </WebLLMProvider>
            </OllamaProvider>
          </LlamaCppProvider>
        </LoadingScreenWrapper>
      </body>
      <GoogleAnalytics gaId="G-4186JP0XGB" />
    </html>
  );
}
