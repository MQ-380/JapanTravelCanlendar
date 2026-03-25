'use client';

import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, Globe, ChevronDown, Activity } from 'lucide-react';
import { useLanguage } from '../app/i18n/context';
import { Language } from '../app/i18n/translations';
import { ThemeToggle } from './ThemeProvider';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { language, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const locale = (params.locale as string) || language;

  const handleLanguageChange = (newLocale: Language) => {
    const segments = pathname.split('/');
    if (['en', 'ja', 'zh'].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join('/') || `/${newLocale}`);
    setIsLangOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = () => setIsLangOpen(false);
    if (isLangOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isLangOpen]);

  const isHomeActive = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isCityActive = pathname.startsWith(`/${locale}/city`);
  const isLiveActive = pathname.startsWith(`/${locale}/live`);

  return (
    <header className="bg-white dark:bg-[#1e1828] border-b border-pink-100 dark:border-pink-900/30 shadow-sm sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Logo/Brand */}
        <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🌸</span>
          <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-xl">{t('navTitle')}</span>
          <span className="text-pink-400 font-light text-xl">{t('navSubtitle')}</span>
        </Link>

        {/* Navigation Context & Controls */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
            <Link
              href={`/${locale}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isHomeActive
                  ? 'bg-white dark:bg-slate-700 text-pink-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t('navCalendar')}</span>
            </Link>
            <Link
              href={`/${locale}/city`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCityActive
                  ? 'bg-white dark:bg-slate-700 text-pink-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{t('navSearch')}</span>
            </Link>
            <Link
              href={`/${locale}/live`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isLiveActive
                  ? 'bg-white dark:bg-slate-700 text-pink-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{t('navLive')}</span>
            </Link>
          </nav>

          {/* Dark Mode Toggle */}
          <ThemeToggle />

          {/* Language Toggle */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLangOpen(!isLangOpen);
              }}
              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium uppercase">{language}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isLangOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#231c2a] rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 transform origin-top overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[60]">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors ${language === 'en' ? 'text-pink-600 font-semibold bg-pink-50/50 dark:bg-pink-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('zh')}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors ${language === 'zh' ? 'text-pink-600 font-semibold bg-pink-50/50 dark:bg-pink-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  中文
                </button>
                <button
                  onClick={() => handleLanguageChange('ja')}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors ${language === 'ja' ? 'text-pink-600 font-semibold bg-pink-50/50 dark:bg-pink-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                >
                  日本語
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
