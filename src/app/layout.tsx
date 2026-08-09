import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import Script from "next/script";
import ThemeToggle from "@/components/ThemeToggle";
import PostHogProvider from "@/components/PostHogProvider";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = "manu built what?";
const siteDescription = "A build log of things Manu made in 2026.";

// This is the fallback used only if some future page forgets to export its
// own metadata. Every real page should call buildMetadata() from
// @/lib/seo instead, so its OpenGraph/Twitter card reflects that page
// rather than silently inheriting this generic one.
const fallbackMetadata = buildMetadata({
  title: siteName,
  description: siteDescription,
  path: "/",
  isHome: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: fallbackMetadata.openGraph,
  twitter: fallbackMetadata.twitter,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <Script
          id="no-flash-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var saved = localStorage.getItem("site-theme");
                  if (saved === "dark") document.documentElement.classList.add("dark");
                } catch (e) {}
              })();
            `,
          }}
        />
        <PostHogProvider>
          <ThemeToggle />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
