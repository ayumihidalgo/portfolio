// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayumi Hidalgo — Software Engineer",
  description: "Portfolio of Ayumi Hidalgo, Software Engineer specializing in full-stack web development and enterprise systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}