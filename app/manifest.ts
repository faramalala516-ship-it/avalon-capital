import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avalon Capital",
    short_name: "Avalon",
    description: "AI financial intelligence for institutional investors.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070c",
    theme_color: "#d8aa46",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
