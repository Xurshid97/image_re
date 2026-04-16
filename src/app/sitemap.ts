import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

const landingRoutes = [
  "photo-resizer-for-instagram",
  "instagram-resizer",
  "resizer-for-instagram",
  "resize-image-for-instagram",
  "promo-image-resizer",
  "picture-resizer-for-instagram",
  "instagram-image-resizer",
  "instagram-photo-resizer",
  "linkedin-cover-photo-size-converter",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/enhance`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const landingEntries: MetadataRoute.Sitemap = landingRoutes.map((route) => ({
    url: `${siteUrl}/${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  return [...baseEntries, ...landingEntries];
}
