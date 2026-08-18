import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Based CRM",
  description: "A simple, fast CRM with a dead-simple login.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
