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
    default: "RUET CSE ’25 Student Portal",
    template: "%s | RUET CSE ’25",
  },
  description:
    "The RUET CSE 25 student portal: find classmates in the student directory, browse sections, and access resources for Rajshahi University of Engineering & Technology Computer Science and Engineering students.",
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
    siteName: "RUET CSE ’25 Student Portal",
    title: "RUET CSE ’25 Student Portal",
    description:
      "Find RUET CSE ’25 classmates, browse section directories, and connect with the batch community.",
    images: [{ url: "/ruet-logo.png", alt: "RUET emblem" }],
  },
  twitter: {
    card: "summary",
    title: "RUET CSE ’25 Student Portal",
    description:
      "Find RUET CSE ’25 classmates and browse the student directory.",
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