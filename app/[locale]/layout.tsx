import type {Metadata} from 'next';
import '../globals.css'; // Global styles
import { LanguageProvider } from '../i18n/context';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Analytics } from '@vercel/analytics/next';
import { Language } from '../i18n/translations';
import { ThemeProvider } from '../../components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Sakura Forecast Aggregator',
  description: 'Track the best sakura viewing periods across Japan',
};

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = params.locale as Language;

  return (
    <html lang={locale}>
      <body suppressHydrationWarning className="bg-[#fdf9fa] dark:bg-[#1a1520] text-slate-800 dark:text-slate-100 font-sans min-h-screen flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider initialLanguage={locale}>
            <Navbar />
            <div className="flex-1">
              {props.children}
            </div>
            <Analytics />
            <Footer />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
