'use client';

import { useLanguage } from '../app/i18n/context';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-slate-200 py-8 mt-12 bg-white flex-shrink-0">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500 space-y-2">
        <p>{t('footerDisclaimer')}</p>
        <div className="flex flex-wrap justify-center items-center gap-4 text-pink-600">
          <a href="https://sakura.weathermap.jp/" target="_blank" rel="noopener noreferrer" className="hover:underline">Weather Map</a>
          <span className="text-slate-300">|</span>
          <a href="https://weathernews.jp/sakura/news/kaikaforecast/" target="_blank" rel="noopener noreferrer" className="hover:underline">Weathernews</a>
          <span className="text-slate-300">|</span>
          <a href="https://s.n-kishou.co.jp/w/sp/sakura/sakura_hw" target="_blank" rel="noopener noreferrer" className="hover:underline">Japan Meteorological Corp</a>
        </div>
        <p className="text-xs text-slate-400 mt-4 leading-relaxed max-w-2xl mx-auto">
          {t('footerWarning')}
        </p>
      </div>
    </footer>
  );
}
