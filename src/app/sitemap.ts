import type { MetadataRoute } from "next";

const baseUrl = "https://ruetcse25.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...(["a", "b", "c"] as const).map((section) => ({
      url: `${baseUrl}/sections/${section}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
