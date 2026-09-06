import type { Metadata } from "next";
import "@/global.css";
import { Providers } from "@/components/providers";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Komari Monitor",
  description: "A simple server monitor tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col transition-colors duration-300">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
