import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Sora } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();
const googleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "pTKSg1qmqvTMplN5TIVOh12OCkDocGVgzh7cJ-APcX8";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Image Resizer Online - Resize for LinkedIn, Instagram, Facebook",
  description:
    "Free image resizer online. Resize images in pixels, keep quality, and export for LinkedIn cover, Instagram post/story, Facebook cover, and YouTube thumbnail.",
  keywords: [
    "image resizer",
    "image resizer online",
    "resize image online free",
    "resize image without losing quality",
    "resize image in pixels",
    "linkedin cover photo size",
    "instagram story size",
    "instagram post size",
    "facebook cover size",
    "youtube thumbnail size",
    "photo resizer",
    "image size converter",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Image Resizer Online",
    description:
      "Resize images for social media sizes in seconds. Works for LinkedIn cover, Instagram, Facebook, and YouTube.",
    siteName: "Image Resizer Online",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "Image Resizer Online logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Resizer Online",
    description:
      "Resize images by width and height, apply social presets, and download high-quality output.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: googleVerification,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Resizer Online",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  description:
    "Free image resizer for LinkedIn, Instagram, Facebook, and YouTube. Resize in pixels and export high-quality images online.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  url: siteUrl,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sora.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
