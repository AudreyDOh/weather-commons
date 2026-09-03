import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_ORIGIN || 'http://localhost:3000'),
  title: 'Realtime Weather — Weather Commons',
  description:
    'An experimental observatory for atmospheric transport, situated knowledge, and a shared sky.',
  openGraph: {
    title: 'Realtime Weather',
    description: 'A shared sky. Many ways of knowing.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Realtime Weather',
    description: 'A shared sky. Many ways of knowing.',
    images: ['/og.png'],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
