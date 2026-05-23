import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Programming Language Genealogy Explorer",
  description: "Explore programming language history through an interactive graph.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full overflow-hidden bg-[#0A0E17] text-slate-100">
        {children}
      </body>
    </html>
  );
}
