import type {Metadata} from 'next';
import {JetBrains_Mono, Archivo_Black} from 'next/font/google';
import './globals.css'; // Global styles

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

// Display face for big wordmarks / headings — a heavy industrial grotesque
// that contrasts the mono body and reinforces the brutalist "signage" feel.
const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LAB. // Premium Stickers & Future Gear',
  description: 'An editorial Neo-Brutalist digital laboratory showcasing premium high-contrast stickers and conceptual future gear.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${archivoBlack.variable} font-mono bg-[#E6DEDD] text-[#1B120F]`}>
      <body className="antialiased select-none" suppressHydrationWarning>{children}</body>
    </html>
  );
}
