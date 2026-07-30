import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.gemstoneyeshootingallery.com";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/galerie`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/espace`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/salle-encheres`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/presentation`, changeFrequency: "monthly", priority: 0.5 }
  ];
}
