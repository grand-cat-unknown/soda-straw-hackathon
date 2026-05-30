import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fluid OS",
  description: "Intent-driven workspace assembled from modular tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
