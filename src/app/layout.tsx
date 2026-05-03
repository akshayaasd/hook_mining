import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Hook Mining Engine — for Pixii",
  description:
    "Crawls 1K viral posts a week. Surfaces the hooks that work. Writes posts in your brand voice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-sans antialiased" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground" suppressHydrationWarning>
        <Nav />
        <main className="mx-auto max-w-[1280px] px-6 pb-20 pt-6 lg:px-10">{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
