import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Basic OpenAI Chat",
  description: "A tiny Next.js chat surface backed by OpenAI.",
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
