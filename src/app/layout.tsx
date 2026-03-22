import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/shared/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Freuter Personal Brand",
  description: "Content-Planung, AI-Ideengenerierung & KPI-Tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background">
        <TooltipProvider>
          <Sidebar />
          <main className="ml-64 min-h-screen p-8">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
