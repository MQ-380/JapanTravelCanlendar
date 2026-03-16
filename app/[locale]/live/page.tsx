'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../i18n/context';
import { translations } from '../../i18n/translations';
import { ExternalLink } from 'lucide-react';

type LiveRow = {
  id: string;
  name: string;
  jpName: string;
  region: string;
  source: string;
  url: string;
  date: string;
  comparedWithAllYears: string | null;
  comparedWithLastYear: string | null;
};

type LiveData = {
  lastUpdated: string;
  flowering: LiveRow[];
  fullBloom: LiveRow[];
};

function DiffBadge({ value, unit, earlierLabel, laterLabel, labelFirst = false }: {
  value: string | null;
  unit: string;
  earlierLabel: string;
  laterLabel: string;
  labelFirst?: boolean;
}) {
  if (value === null || value === undefined) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  const num = parseInt(value, 10);
  if (isNaN(num)) return <span className="text-slate-400 text-xs">—</span>;

  const isEarly = num < 0;
  const isLate = num > 0;
  const abs = Math.abs(num);

  const bgClass = isEarly
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : isLate
    ? 'bg-red-50 text-red-700 border border-red-200'
    : 'bg-slate-50 text-slate-500 border border-slate-200';

  const label = isEarly ? earlierLabel : isLate ? laterLabel : '±0';
  const arrow = isEarly ? '▲' : isLate ? '▼' : '';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${bgClass}`}>
      {arrow}{labelFirst ? `${label}${abs}${unit}` : `${abs}${unit} ${label}`}
    </span>
  );
}

function LiveTable({
  rows,
  title,
  language,
  t,
}: {
  rows: LiveRow[];
  title: string;
  language: string;
  t: (key: keyof typeof translations.en) => string;
}) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
        <p className="text-slate-400 font-medium">{t('liveNoData')}</p>
      </div>
    );
  }

  const sourceRow = rows[0];

  return (
    <div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-pink-50/60 border-b border-pink-100">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">{t('liveColCity')}</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">{t('liveColRegion')}</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">{t('liveColDate')}</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">{t('liveColVsNormal')}</th>
                <th className="px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">{t('liveColVsLastYear')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row, idx) => (
                <motion.tr
                  key={`${row.id}-${row.source}-${idx}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="hover:bg-pink-50/30 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {language === 'en' ? row.name : row.jpName}
                      </span>
                      {language === 'en' && (
                        <span className="text-xs text-slate-400">{row.jpName}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-xs font-medium">
                      {row.region}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-pink-600 text-base">{row.date}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <DiffBadge
                      value={row.comparedWithAllYears}
                      unit={t('liveDaysUnit')}
                      earlierLabel={t('liveEarlier')}
                      laterLabel={t('liveLater')}
                      labelFirst={language === 'zh'}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <DiffBadge
                      value={row.comparedWithLastYear}
                      unit={t('liveDaysUnit')}
                      earlierLabel={t('liveEarlier')}
                      laterLabel={t('liveLater')}
                      labelFirst={language === 'zh'}
                    />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Single source attribution */}
      {sourceRow && (
        <div className="mt-2 flex justify-end">
          <a
            href={sourceRow.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-pink-500 transition-colors"
          >
            {t('liveSource')}: {sourceRow.source}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export default function LiveReportPage() {
  const { t, language } = useLanguage();
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sakura-live')
      .then(res => res.json())
      .then(data => {
        setLiveData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-medium text-sm mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {t('navLive')}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">{t('livePageTitle')}</h1>
        <p className="text-slate-500 text-md sm:text-lg">{t('livePageDesc')}</p>
        {liveData?.lastUpdated && (
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            <span className="font-semibold">{t('lastUpdatedLabel')}:</span>
            <span>{liveData.lastUpdated}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-pink-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {/* Flowering Table */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🌸</span>
              <h2 className="text-xl font-bold text-slate-800">{t('liveFloweringTable')}</h2>
              <span className="ml-auto text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                {liveData?.flowering.length ?? 0} {t('liveColCity')}
              </span>
            </div>
            <LiveTable
              rows={liveData?.flowering ?? []}
              title={t('liveFloweringTable')}
              language={language}
              t={t}
            />
          </motion.section>

          {/* Full Bloom Table */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💮</span>
              <h2 className="text-xl font-bold text-slate-800">{t('liveFullBloomTable')}</h2>
              <span className="ml-auto text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                {liveData?.fullBloom.length ?? 0} {t('liveColCity')}
              </span>
            </div>
            <LiveTable
              rows={liveData?.fullBloom ?? []}
              title={t('liveFullBloomTable')}
              language={language}
              t={t}
            />
          </motion.section>
        </div>
      )}
    </div>
  );
}
