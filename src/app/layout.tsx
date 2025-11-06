import type { Metadata } from "next";
import { Sora, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import NavigationBar from "../components/NavigationBar";
import Footer from "../components/Footer";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TooltipProvider } from "../contexts/TooltipContext";

const sora = Sora({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Belong Here Theater",
  description: "Change the way you cast and audition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
        <ThemeProvider>
          <TooltipProvider>
            <NavigationBar />
            <main className="pt-4 sm:pt-8">{children}</main>
            <Footer />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
