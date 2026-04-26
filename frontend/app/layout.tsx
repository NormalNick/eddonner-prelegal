import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mutual NDA Creator",
  description:
    "Fill in a short form to generate a Common Paper Mutual Non-Disclosure Agreement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
