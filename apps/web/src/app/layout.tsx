import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consecom Routing — AI API Gateway',
  description:
    'One API key. Every AI model. Auth, billing, rate limits and routing — handled.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}