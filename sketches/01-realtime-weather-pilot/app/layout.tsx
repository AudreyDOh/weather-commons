import type { Metadata } from 'next';
import './globals.css';
import './earth-workspace.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_ORIGIN || 'http://localhost:3000'),
  title: 'Realtime Weather pilot',
  description:
    'An experimental observatory for atmospheric transport, situated knowledge, and a shared sky.',
  openGraph: {
    title: 'Realtime Weather pilot',
    description: 'A shared sky. Many ways of knowing.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Realtime Weather pilot',
    description: 'A shared sky. Many ways of knowing.',
    images: ['/og.png'],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
