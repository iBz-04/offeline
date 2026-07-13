import type { Metadata } from "next";
import { Fredoka, Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { WebLLMProvider } from "@/providers/web-llm-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { LoadingScreenWrapper } from "@/components/loading-screen-wrapper";
import { MobileViewportSync } from "@/components/mobile-viewport-sync";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});

const metainfo = {
  name: "Offeline",
  title: "Offeline",
  description: "Chat with llm and slms privately, and locally on your machine and browser",
  url: "https://www.offeline.com",
  image: "https://res.cloudinary.com/diekemzs9/image/upload/v1761411186/Screenshot_2025-10-25_184555_va3jxk.png",
};

export const metadata: Metadata = {
  metadataBase: new URL(metainfo.url),
  title: {
    default: metainfo.name,
    template: "%s - " + metainfo.name,
  },
  description: metainfo.description,
  icons: {
    icon: "/offeline.png",
    apple: "/offeline.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: metainfo.name,
  },
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
  viewportFit: "cover",
  themeColor: "#faf8f3",
  interactiveWidget: "resizes-content",
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
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
      <body className={`${fredoka.variable} ${quicksand.variable} font-body h-app w-full overflow-hidden touch-manipulation`}>
        <MobileViewportSync />
        <LoadingScreenWrapper>
          <WebLLMProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              forcedTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <div className="h-app w-full flex flex-col overflow-hidden">
                <Suspense>
                  {children}
                </Suspense>
              </div>
              <Toaster
                position="top-right"
                className="!top-[max(1rem,env(safe-area-inset-top))] !right-[max(1rem,env(safe-area-inset-right))]"
              />
            </ThemeProvider>
          </WebLLMProvider>
        </LoadingScreenWrapper>
        <Analytics />
      </body>
      <GoogleAnalytics gaId="G-4186JP0XGB" />
    </html>
  );
}
