import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consecom AI — Modelos e consumo em um só lugar',
  description: 'Trabalhe com Claude Code por meio de uma API compatível, com pacotes de consumo, chaves individuais e acompanhamento de utilização.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
