import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ui/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ruetcse25.vercel.app"),
  title: {
    default: "RUET CSE '25",
    template: "%s | RUET CSE '25",
  },
  description:
    "RUET CSE 25 batch portal. Access class routine, syllabus, student directory, notices, and drive resources for RUET CSE 2025.",
  keywords: [
    "RUET CSE 25",
    "RUET CSE 25 student portal",
    "RUET CSE batch 25",
    "RUET student directory",
    "Rajshahi University of Engineering and Technology",
    "RUET classmates",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://ruetcse25.vercel.app/",
    siteName: "RUET CSE '25",
    title: "RUET CSE '25",
    description: "RUET CSE 25 batch portal. Access class routine, syllabus, student directory, notices, and drive resources for RUET CSE 2025.",
    images: [{ url: "/ruet-logo.png", alt: "RUET emblem" }],
  },
  twitter: {
    card: "summary",
    title: "RUET CSE '25",
    description: "RUET CSE 25 batch portal. Access class routine, syllabus, student directory, notices, and drive resources for RUET CSE 2025.",
    images: ["/ruet-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "-g_OY2KBRvnN8qzV2BybPFnaJDznk5MhHDrsEqqMEi0",
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RUET CSE 25",
  url: "https://ruetcse25.vercel.app",
  alternateName: "RUET CSE 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full overflow-x-hidden bg-[#DDFBEF] text-[#2F4858]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <div className="ambient-lights" aria-hidden="true">
            <span className="ambient-light ambient-light-one" />
            <span className="ambient-light ambient-light-two" />
            <span className="ambient-light ambient-light-three" />
          </div>
          <div className="site-content">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}