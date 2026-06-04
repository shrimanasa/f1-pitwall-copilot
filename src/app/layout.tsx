import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BrainCircuit } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PitWall Core // Human Intelligence",
  description: "Advanced F1 Strategy & Behavioral Analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-background text-slate-300 flex flex-col overflow-hidden">
        {/* Sleek, professional top navigation */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-f1-cyan to-blue-600 flex items-center justify-center shadow-lg shadow-f1-cyan/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-white tracking-wide">PitWall Core</span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-400 ml-2 border border-white/10 hidden sm:block">
              Human Threat Intel
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
             <div className="flex items-center space-x-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-slate-400">Granite Engine</span>
             </div>
             <div className="flex items-center space-x-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-slate-400">Docling RAG</span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto relative p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
