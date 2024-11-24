import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { WebLLMProvider } from "@/providers/web-llm-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";

const metainfo = {
  name: "OmniBot",
  title: "OmniBot",
  description: "Chat with llm models offline and in your browser",
  url: "https://chattyui.com",
  icons: {
    icon: "/chatbot.png",
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
    <html lang="en">
      <body className={GeistSans.className}>
        <WebLLMProvider>
          <ThemeProvider attribute="class" defaultTheme="system">
            <Suspense>
              {children}
            </Suspense>
            <Toaster position="top-right" />
          </ThemeProvider>
        </WebLLMProvider>
      </body>
      <GoogleAnalytics gaId="G-6X7CQT49KF" />
    </html>
  );
}
