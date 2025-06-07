import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { FileProvider } from "@/contexts/FileContext";
import "xterm/css/xterm.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI IDE",
  description: "A modern IDE with AI capabilities",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <FileProvider>
            <main className="min-h-screen bg-gray-900 text-white">{children}</main>
          </FileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
