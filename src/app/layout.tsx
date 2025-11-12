import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tourism Together",
  description: "A platform to explore and share travel experiences.",
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
