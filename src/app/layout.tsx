import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Syne } from "next/font/google";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";
import "./globals.css";
import { cn } from "@/lib/utils";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  // Semibold covers brand + headings; optional avoids LCP waiting on Slow 4G.
  weight: ["600"],
  display: "optional",
  preload: true,
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  // Single weight — hero body copy is the LCP element; don't block paint on webfonts.
  weight: ["400"],
  display: "optional",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `AI Character Creator with Long-Term Memory | ${SITE_NAME}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    types: {
      "text/plain": [
        { url: "/llms.txt", title: "llms.txt" },
        { url: "/llms-full.txt", title: "llms-full.txt" },
      ],
      "text/markdown": [
        { url: "/skill", title: "Vesperer agent skill" },
        { url: "/skill/reference", title: "Vesperer API reference" },
        { url: "/skill/runtime", title: "Vesperer runtime envelope" },
      ],
    },
  },
  keywords: [
    "AI character creator",
    "AI characters with memory",
    "create AI character",
    "portable AI personality",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: `AI Character Creator with Long-Term Memory | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `AI Character Creator with Long-Term Memory | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full font-sans antialiased",
        display.variable,
        body.variable,
      )}
    >
      <body className="min-h-full font-[family-name:var(--font-body)]">
        {/* GA after idle/interaction — keeps gtag off LCP/TBT for PageSpeed cold loads. */}
        <Script id="google-analytics-deferred" strategy="lazyOnload">
          {`
            (function () {
              var loaded = false;
              function load() {
                if (loaded) return;
                loaded = true;
                var s = document.createElement('script');
                s.src = 'https://www.googletagmanager.com/gtag/js?id=G-NTQQWCJW1F';
                s.async = true;
                document.head.appendChild(s);
                window.dataLayer = window.dataLayer || [];
                function gtag(){ dataLayer.push(arguments); }
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', 'G-NTQQWCJW1F', { send_page_view: true });
              }
              function arm() {
                if ('requestIdleCallback' in window) {
                  requestIdleCallback(function () { setTimeout(load, 5000); }, { timeout: 8000 });
                } else {
                  setTimeout(load, 6000);
                }
              }
              ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
                window.addEventListener(evt, load, { once: true, passive: true });
              });
              if (document.readyState === 'complete') arm();
              else window.addEventListener('load', arm, { once: true });
            })();
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
