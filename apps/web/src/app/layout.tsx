import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consecom Routing — Claude Code ilimitado por assinatura',
  description:
    'Acesso ilimitado ao Claude Code por 24h, 3 dias, 7 dias ou 30 dias. Sem mexer em tokens, sem cartão de crédito internacional. Sua key pessoal em 60 segundos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg text-fg antialiased font-sans">{children}</body>
    </html>
  );
}
