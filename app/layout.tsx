import type { Metadata } from "next";
import { Inter, Roboto_Mono, PT_Serif, Roboto } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster"
import { NetworkStatus } from "@/components/network-status";

// Load Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Load Roboto Mono for monospace
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

// Load other font options
const ptSerif = PT_Serif({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pt-serif",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FundSol | Solana Fundraising Platform",
  description: "A GoFundMe-style donation platform built on Solana",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://fundsol.vercel.app/'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "./",
    siteName: "FundSol",
    title: "FundSol | Solana Fundraising Platform",
    description: "A GoFundMe-style donation platform built on Solana blockchain",
    images: [
      {
        url: "/og-image.png", // Default image for social sharing
        width: 1200,
        height: 630,
        alt: "FundSol - Fundraising on Solana"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FundSol | Solana Fundraising Platform",
    description: "A GoFundMe-style donation platform built on Solana",
    images: ["/og-image.png"],
    creator: "@fundsol"
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} ${ptSerif.variable} ${roboto.variable} font-sans antialiased min-h-screen bg-[#fefdf9]`}
      >
        <Providers>
          <Navbar />
          <div className="flex flex-col min-h-[calc(100vh-64px)]">
            {children}
            <Footer />
          </div>
          <Toaster />
          <NetworkStatus />
        </Providers>
      </body>
    </html>
  );
}
