import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "Tourism Together",
    template: "%s | Tourism Together",
  },
  description:
    "A platform to explore and share travel experiences. Plan your trips, discover destinations, share your travel diaries, and connect with fellow travelers.",
  keywords: [
    "travel",
    "tourism",
    "trip planning",
    "travel diary",
    "destinations",
    "adventure",
    "explore",
  ],
  authors: [{ name: "Tourism Together" }],
  creator: "Tourism Together",
  publisher: "Tourism Together",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Tourism Together - Explore and Share Travel Experiences",
    description:
      "A platform to explore and share travel experiences. Plan your trips, discover destinations, share your travel diaries, and connect with fellow travelers.",
    siteName: "Tourism Together",
    images: [
      {
        url: "/meta.jpg",
        width: 1200,
        height: 630,
        alt: "Tourism Together",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tourism Together - Explore and Share Travel Experiences",
    description:
      "A platform to explore and share travel experiences. Plan your trips, discover destinations, share your travel diaries, and connect with fellow travelers.",
    images: ["/meta.jpg"],
  },
  icons: {
    icon: [
      { url: "/meta.jpg", sizes: "any" },
      { url: "/meta.jpg", type: "image/jpeg" },
    ],
    apple: [{ url: "/meta.jpg", sizes: "180x180", type: "image/jpeg" }],
    shortcut: "/meta.jpg",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
