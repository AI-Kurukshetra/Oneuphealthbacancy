import type { Metadata } from "next";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "HealthBridge",
  description: "Unified Healthcare Data Exchange Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
