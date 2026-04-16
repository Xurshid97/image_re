import type { Metadata } from "next";
import EnhanceClient from "./enhance-client";

export const metadata: Metadata = {
  title: "Image Enhancer - Improve Image Quality Online",
  description:
    "Enhance image quality online without changing dimensions. Reduce noise, sharpen details, and export high-quality PNG, JPG, or WebP.",
  keywords: [
    "image enhancer",
    "enhance image quality",
    "improve image quality",
    "photo enhancer online",
    "sharpen image online",
    "denoise image",
  ],
  alternates: {
    canonical: "/enhance",
  },
  openGraph: {
    title: "Image Enhancer - Improve Image Quality Online",
    description: "Enhance photo clarity and detail at the same size. Export in PNG, JPG, or WebP.",
    url: "/enhance",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Enhancer - Improve Image Quality Online",
    description: "Enhance image quality online while keeping dimensions unchanged.",
  },
};

export default function EnhancePage() {
  return <EnhanceClient />;
}
