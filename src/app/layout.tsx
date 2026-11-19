import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../../web/site.css";
import "../../web/gate.css";

export const metadata: Metadata = {
  title: "Sandy’s Scrapbook",
  robots: { index: false, follow: false, noarchive: true },
  icons: { icon: { url: "/assets/icon.webp", type: "image/webp" } },
};

export const viewport: Viewport = { themeColor: "#fff" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
