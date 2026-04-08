import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://theplanningconsultant.com",
      priority: 1.0,
      changeFrequency: "daily",
    },
    {
      url: "https://theplanningconsultant.com/check",
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      url: "https://theplanningconsultant.com/statement",
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      url: "https://theplanningconsultant.com/pricing",
      priority: 0.8,
      changeFrequency: "weekly",
    },
    {
      url: "https://theplanningconsultant.com/privacy",
      priority: 0.3,
      changeFrequency: "monthly",
    },
    {
      url: "https://theplanningconsultant.com/terms",
      priority: 0.3,
      changeFrequency: "monthly",
    },
  ];
}
