'use client';

import { useLanguage } from '../app/i18n/context';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-700 py-8 mt-12 bg-white dark:bg-[#1e1828] flex-shrink-0 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
        <p>{t('footerDisclaimer')}</p>
        <div className="flex flex-wrap justify-center items-center gap-4 text-pink-600 dark:text-pink-400">
          <a href="https://sakura.weathermap.jp/" target="_blank" rel="noopener noreferrer" className="hover:underline">Weather Map</a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a href="https://weathernews.jp/sakura/news/kaikaforecast/" target="_blank" rel="noopener noreferrer" className="hover:underline">Weathernews</a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a href="https://s.n-kishou.co.jp/w/sp/sakura/sakura_hw" target="_blank" rel="noopener noreferrer" className="hover:underline">Japan Meteorological Corp</a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a href="https://tenki.jp/sakura/expectation/" target="_blank" rel="noopener noreferrer" className="hover:underline">tenki.jp</a>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 leading-relaxed max-w-2xl mx-auto">
          {t('footerWarning')}
        </p>
      </div>
    </footer>
  );
}
