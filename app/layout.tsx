import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { LanguageProvider } from './i18n/context';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Sakura Forecast Aggregator',
  description: 'Track the best sakura viewing periods across Japan',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-[#fdf9fa] text-slate-800 font-sans min-h-screen flex flex-col">
        <LanguageProvider>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Analytics />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
