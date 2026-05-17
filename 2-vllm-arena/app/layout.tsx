import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "vLLM Arena | TwelveLabs",
  description:
    "Compare TwelveLabs Jockey against market video-language models on shared corpora.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
