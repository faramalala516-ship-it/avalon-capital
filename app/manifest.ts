import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gem'StonEye'Shootin'Gallery",
    short_name: "GSES Gallery",
    description: "Photographies de minerais de Madagascar — Europe",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f4",
    theme_color: "#0d3d45",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
  };
}
