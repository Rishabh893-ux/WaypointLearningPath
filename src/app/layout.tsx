import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import CommandPalette from "@/components/CommandPalette";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Waypoint — Personalized Learning Paths",
  description: "AI-powered personalized learning path recommender",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.dataset.theme=localStorage.getItem('theme')||'beige'}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <ToastProvider>
          <AppShell>{children}</AppShell>
          <CommandPalette />
        </ToastProvider>
      </body>
    </html>
  );
}
