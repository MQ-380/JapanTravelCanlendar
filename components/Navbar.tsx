'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, MapPin, Globe } from 'lucide-react';
import { useLanguage } from '../app/i18n/context';
import { Language } from '../app/i18n/translations';

export default function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-white border-b border-pink-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Logo/Brand */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🌸</span>
          <span className="font-bold text-slate-800 tracking-tight text-xl">{t('navTitle')}</span>
          <span className="text-pink-400 font-light text-xl">{t('navSubtitle')}</span>
        </Link>
        
        {/* Navigation Context & Controls */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-2 bg-slate-50/80 p-1 rounded-xl border border-slate-100">
            <Link 
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t('navCalendar')}</span>
            </Link>
            <Link 
              href="/city"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/city') ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{t('navSearch')}</span>
            </Link>
          </nav>

          {/* Language Toggle */}
          <div className="relative group">
            <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium uppercase">{language}</span>
            </div>
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all transform origin-top overflow-hidden">
              <button onClick={() => setLanguage('en')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 transition-colors ${language === 'en' ? 'text-pink-600 font-semibold bg-pink-50/50' : 'text-slate-700'}`}>English</button>
              <button onClick={() => setLanguage('zh')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 transition-colors ${language === 'zh' ? 'text-pink-600 font-semibold bg-pink-50/50' : 'text-slate-700'}`}>中文</button>
              <button onClick={() => setLanguage('ja')} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-pink-50 transition-colors ${language === 'ja' ? 'text-pink-600 font-semibold bg-pink-50/50' : 'text-slate-700'}`}>日本語</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
