import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-playfair' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = { title: 'Lista de presentes' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${playfair.variable} ${inter.variable} bg-marfim font-sans text-cacau antialiased`}
      >
        {children}
      </body>
    </html>
  );
}