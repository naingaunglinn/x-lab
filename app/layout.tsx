import type {Metadata} from 'next';
import {JetBrains_Mono} from 'next/font/google';
import './globals.css'; // Global styles

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LAB. // Premium Stickers & Future Gear',
  description: 'An editorial Neo-Brutalist digital laboratory showcasing premium high-contrast stickers and conceptual future gear.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} font-mono bg-[#E6DEDD] text-[#1B120F]`}>
      <body className="antialiased select-none" suppressHydrationWarning>{children}</body>
    </html>
  );
}
