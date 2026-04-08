import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { CookieBanner } from '@/components/ui/CookieBanner';
import { AnalyticsWrapper } from "@/components/ui/AnalyticsWrapper";
import "./globals.css";


const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "The Planning Consultant — Instant UK Planning Reports",
    template: "%s | The Planning Consultant — Instant UK Planning Reports",
  },
  icons: {
    icon: "/favicon.png",
  },
  description: "Instant planning constraint reports for any UK address. Check conservation areas, permitted development rights, flood zones and more in under 60 seconds.",
  metadataBase: new URL("https://theplanningconsultant.com"),
  openGraph: {
    type: "website",
    siteName: "The Planning Consultant",
    title: "The Planning Consultant — Instant UK Planning Reports",
    description: "Instant planning constraint reports for any UK address. Check conservation areas, permitted development rights, flood zones and more in under 60 seconds.",
    url: "https://theplanningconsultant.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Planning Consultant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Planning Consultant — Instant UK Planning Reports",
    description: "Instant planning constraint reports for any UK address.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
