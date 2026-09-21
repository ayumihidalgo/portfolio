// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ayumi Hidalgo — Software Engineer",
  description:
    "Portfolio of Ayumi Hidalgo, Software Engineer specializing in full-stack web development and enterprise systems.",
};

export const viewport: Viewport = {
  themeColor: "#fff7e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="font-sans antialiased text-ink">{children}</body>
    </html>
  );
}
