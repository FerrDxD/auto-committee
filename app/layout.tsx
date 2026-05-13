import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Network, Users } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoCommittee | SMAN 2 Jonggol",
  description: "Sistem Automasi Kepanitiaan OSIS & MPK",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased selection:bg-primary/20`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          
          {/* --- DECORATIVE BACKGROUND (Bikin Ngga Flat) --- */}
          <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="fixed left-0 right-0 top-[-10%] -z-10 m-auto h-[300px] w-[300px] rounded-full bg-primary/20 opacity-50 blur-[120px]"></div>
          {/* ----------------------------------------------- */}

          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/40">
            <div className="container mx-auto max-w-5xl flex h-16 items-center justify-between px-6">
              <div className="flex gap-2 items-center font-bold text-xl tracking-tight text-foreground">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span>Auto<span className="text-primary">Committee</span></span>
              </div>
              
              <nav className="flex items-center gap-4 sm:gap-6 text-sm font-semibold text-muted-foreground">
                <Link href="/" className="flex items-center gap-2 hover:text-primary transition-all">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link href="/mapping" className="flex items-center gap-2 hover:text-primary transition-all">
                  <Network className="w-4 h-4" />
                  <span className="hidden sm:inline">Training AI</span>
                </Link>
                <div className="pl-4 border-l border-border/50">
                  <ModeToggle />
                </div>
              </nav>
            </div>
          </header>
          <main className="pb-12 pt-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}