import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import HubFrame from "@/components/hub-frame";
import { AuthProvider } from "@/hooks/use-auth";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RUET CSE '25 Hub",
    template: "%s | RUET CSE '25 Hub",
  },
  description:
    "Official batch portal for RUET CSE '25: real-time routine updates, academic task deadlines, notice broadcasts, and student directory.",
  applicationName: "RUET CSE '25 Hub",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#2F4858",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body className={fontSans.className}>
        <AuthProvider>
          <HubFrame>{children}</HubFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
