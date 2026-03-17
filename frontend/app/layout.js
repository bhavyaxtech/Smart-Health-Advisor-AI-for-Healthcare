import Script from "next/script";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata = {
  title: "Smart Health Advisor AI",
  description:
    "A polished health intelligence workspace with Google-authenticated access, longitudinal symptom tracking, and PubMed-backed educational guidance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fraunces.variable} min-h-screen bg-mist font-body text-ink antialiased`}
      >
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
