import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "MPS - Waste Shipment Platform",
  description: "Centralized waste shipment tracking and reporting platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/Favicon.png",
    apple: "/Favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MPS",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#00BD9D" />
        <link rel="icon" href="/Favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Favicon.png" />
      </head>
      <body
        className={`${inter.className} ${jetbrainsMono.variable} antialiased theme-brand`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
