import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "URL Threat Analyzer",
  description: "Check links for common phishing warning signs.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
