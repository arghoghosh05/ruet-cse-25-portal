import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/sections/"],
      disallow: ["/admin/", "/api/", "/auth/", "/submit-profile"],
    },
    sitemap: "https://ruetcse25.vercel.app/sitemap.xml",
    host: "https://ruetcse25.vercel.app",
  };
}
