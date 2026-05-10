import type { Metadata } from 'next'
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: 'CheevoVault',
  description: 'Track your achievements across RetroAchievements and Steam in one place.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className="bg-bg-header">
      <body className="text-text-main bg-bg-main">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
