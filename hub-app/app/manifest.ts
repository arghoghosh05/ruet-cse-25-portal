import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RUET CSE '25 Hub",
    short_name: "CSE '25 Hub",
    description:
      "Batch notices, class routine, academic work, courses, and student directory.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f7f5",
    theme_color: "#203b49",
    icons: [
      {
        src: "/hub-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
