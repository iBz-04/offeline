import { InfoPage } from "@/components/info-page";
import { aboutPage } from "@/lib/info-pages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="h-app overflow-y-auto px-6 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <InfoPage config={aboutPage} />
      </div>
    </main>
  );
}
