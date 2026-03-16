'use client';

import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, Globe, ChevronDown, Activity } from 'lucide-react';
import { useLanguage } from '../app/i18n/context';
import { Language } from '../app/i18n/translations';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { language, t } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const locale = (params.locale as string) || language;

  const handleLanguageChange = (newLocale: Language) => {
    const segments = pathname.split('/');
    // Check if the first segment is a locale
    if (['en', 'ja', 'zh'].includes(segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join('/') || `/${newLocale}`);
    setIsLangOpen(false);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setIsLangOpen(false);
    if (isLangOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isLangOpen]);

  // Determine active states
  const isHomeActive = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isCityActive = pathname.startsWith(`/${locale}/city`);
  const isLiveActive = pathname.startsWith(`/${locale}/live`);

  return (
    <header className="bg-white border-b border-pink-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Logo/Brand */}
        <Link href={`/${locale}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🌸</span>
          <span className="font-bold text-slate-800 tracking-tight text-xl">{t('navTitle')}</span>
          <span className="text-pink-400 font-light text-xl">{t('navSubtitle')}</span>
        </Link>
        
        {/* Navigation Context & Controls */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-2 bg-slate-50/80 p-1 rounded-xl border border-slate-100">
            <Link 
              href={`/${locale}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isHomeActive ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t('navCalendar')}</span>
            </Link>
            <Link 
              href={`/${locale}/city`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCityActive ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{t('navSearch')}</span>
            </Link>
            <Link 
              href={`/${locale}/live`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isLiveActive ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{t('navLive')}</span>
            </Link>
          </nav>

          {/* Language Toggle */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsLangOpen(!isLangOpen);
              }}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium uppercase">{language}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isLangOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 transform origin-top overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[60]">
                <button 
                  onClick={() => handleLanguageChange('en')} 
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 transition-colors ${language === 'en' ? 'text-pink-600 font-semibold bg-pink-50/50' : 'text-slate-700'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => handleLanguageChange('zh')} 
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 transition-colors ${language === 'zh' ? 'text-pink-600 font-semibold bg-pink-50/50' : 'text-slate-700'}`}
                >
                  中文
                </button>
                <button 
                  onClick={() => handleLanguageChange('ja')} 
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 transition-colors ${language === 'ja' ? 'text-pink-600 font-semibold bg-pink-50/50' : 'text-slate-700'}`}
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
