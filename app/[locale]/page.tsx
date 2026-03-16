'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/context';

type CityData = {
  id: string;
  name: string;
  jpName: string;
  region?: string;
};

type LiveRow = {
  id: string;
  name: string;
  jpName: string;
  region: string;
  source: string;
  url: string;
  date: string; // e.g. "3/16"
  comparedWithAllYears: string | null;
  comparedWithLastYear: string | null;
  type: 'flowering' | 'fullBloom';
};

type OverviewResponse = {
  lastUpdated: Record<string, string>;
  cities: CityData[];
  globalStart: string | null;
  globalEnd: string | null;
};

export default function GlobalCalendarPage() {
  const { t, language } = useLanguage();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  
  // Calendar State
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [bloomingCitiesOnDate, setBloomingCitiesOnDate] = useState<any[]>([]);
  const [loadingBlooming, setLoadingBlooming] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [liveRows, setLiveRows] = useState<LiveRow[]>([]);

  const [activeMonthTab, setActiveMonthTab] = useState<number>(() => {
    const m = new Date().getMonth(); // 0-indexed
    return m >= 2 && m <= 4 ? m : 2; // clamp to Mar–May, default March
  });

  useEffect(() => {
    fetch('/api/sakura?type=overview')
      .then(res => res.json())
      .then(data => {
        setOverview(data);
        // Auto-select today if it falls within the season range
        if (data.globalStart && data.globalEnd) {
          const rawToday = new Date();
          const today = new Date(rawToday.getFullYear(), rawToday.getMonth(), rawToday.getDate());
          const globalStartEpoch = new Date(data.globalStart).getTime();
          const globalEndEpoch = new Date(data.globalEnd).getTime();
          const todayEpoch = today.getTime();
          if (todayEpoch >= globalStartEpoch && todayEpoch <= globalEndEpoch) {
            setSelectedCalendarDate(today);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Fetch live JMA data once
  useEffect(() => {
    fetch('/api/sakura-live')
      .then(res => res.json())
      .then(data => {
        const flowering: LiveRow[] = (data.flowering || []).map((r: any) => ({ ...r, type: 'flowering' }));
        const fullBloom: LiveRow[] = (data.fullBloom || []).map((r: any) => ({ ...r, type: 'fullBloom' }));
        setLiveRows([...flowering, ...fullBloom]);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCalendarDate) {
      setLoadingBlooming(true);
      const d = selectedCalendarDate;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      fetch(`/api/sakura?type=date&date=${dateStr}`)
        .then(res => res.json())
        .then(data => {
          setBloomingCitiesOnDate(data.cities || []);
          setSelectedRegion("All");
          setLoadingBlooming(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingBlooming(false);
        });
    } else {
      setBloomingCitiesOnDate([]);
    }
  }, [selectedCalendarDate]);

  const renderMonth = (year: number, month: number, isHiddenMobile: boolean = false) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const monthName = new Date(year, month).toLocaleString(language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'en-US', { month: 'long' });

    const globalStartEpoch = overview?.globalStart ? new Date(overview.globalStart).getTime() : 0;
    const globalEndEpoch = overview?.globalEnd ? new Date(overview.globalEnd).getTime() : 0;

    return (
      <div className={`flex-1 min-w-[250px] ${isHiddenMobile ? 'hidden lg:block' : 'block'}`}>
        <h4 className="text-center font-semibold text-slate-800 mb-4 text-lg">{year} {monthName}</h4>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(d => (
            <div key={d} className="text-slate-400 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-sm">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-10"></div>;
            
            const currentDate = new Date(year, month, day);
            const currentEpoch = currentDate.getTime();
            
            const isSelectable = globalStartEpoch > 0 && currentEpoch >= globalStartEpoch && currentEpoch <= globalEndEpoch;
            const isSelected = selectedCalendarDate?.getTime() === currentEpoch;
            
            return (
              <button 
                key={day} 
                disabled={!isSelectable}
                onClick={() => isSelectable && setSelectedCalendarDate(currentDate)}
                className={`h-10 flex flex-col items-center justify-center relative rounded-full transition-all
                  ${isSelectable ? 'cursor-pointer hover:bg-pink-100' : 'opacity-40 cursor-not-allowed'}
                  ${isSelected ? 'bg-pink-500 text-white hover:bg-pink-600 shadow-md transform scale-105' : 'text-slate-700'}
                `}
              >
                <span className={`font-medium ${isSelected ? 'text-white' : ''}`}>
                  {day}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      
      {/* Interactive Global Calendar Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-sm border border-slate-100 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 text-pink-600 rounded-full font-medium text-sm mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
              </span>
              {t('interactiveCalendarLabel')}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">{t('interactiveCalendarTitle')}</h2>
            <p className="text-slate-500 text-md sm:text-lg mb-4">
              {t('interactiveCalendarDesc')}
            </p>
            {overview?.lastUpdated && (
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-400 bg-slate-50 py-2 px-4 rounded-lg border border-slate-100">
                <span className="font-semibold">{t('lastUpdatedLabel')}</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#4A90E2]"></span> Map: {overview.lastUpdated.weatherMap || '-'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#F5A623]"></span> News: {overview.lastUpdated.weathernews || '-'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71]"></span> JMC: {overview.lastUpdated.japanMeteorologicalCorp || '-'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#9B59B6]"></span> tenki: {overview.lastUpdated['tenki.jp'] || '-'}
                </span>
              </div>
            )}
          </div>

          {/* Mobile Month Tabs */}
          <div className="flex lg:hidden justify-center items-center gap-2 mb-8 bg-slate-50 p-2 rounded-xl">
            {[2, 3, 4].map(m => {
              const mName = new Date(2026, m).toLocaleString(language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'en-US', { month: 'short' });
              return (
                <button
                  key={m}
                  onClick={() => setActiveMonthTab(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeMonthTab === m ? 'bg-white shadow-sm text-pink-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 justify-center mb-10">
            {renderMonth(2026, 2, activeMonthTab !== 2)} {/* March */}
            {renderMonth(2026, 3, activeMonthTab !== 3)} {/* April */}
            {renderMonth(2026, 4, activeMonthTab !== 4)} {/* May */}
          </div>

          {/* Selected Date Results */}
          {selectedCalendarDate && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 border-t border-slate-100 pt-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">
                  <span className="text-pink-500">
                    {selectedCalendarDate.toLocaleString(language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </h3>
                <div className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                  {loadingBlooming ? t('searching') : (
                    Array.from(new Set(bloomingCitiesOnDate.map(c => c.region))).length > 0 
                      ? `${bloomingCitiesOnDate.filter(c => selectedRegion === "All" || c.region === selectedRegion).length}/${bloomingCitiesOnDate.length} ${t('citiesFound')}`
                      : `${bloomingCitiesOnDate.length} ${t('citiesFound')}`
                  )}
                </div>
              </div>

              {/* JMA Official Announcements for this date */}
              {(() => {
                if (!selectedCalendarDate) return null;
                const m = selectedCalendarDate.getMonth() + 1;
                const d = selectedCalendarDate.getDate();
                const dateKey = `${m}/${d}`;
                const matched = liveRows.filter(r => r.date === dateKey);
                if (matched.length === 0) return null;
                return (
                  <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-sm font-bold text-emerald-800">
                        {language === 'zh' ? '气象厅官方公告' : language === 'ja' ? '気象庁 公式発表' : 'Official JMA Announcement'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {matched.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 rounded-full text-sm hover:border-emerald-400 hover:shadow-sm transition-all"
                        >
                          <span>{r.type === 'flowering' ? '🌸' : '💮'}</span>
                          <span className="font-semibold text-slate-800">{language === 'en' ? r.name : r.jpName}</span>
                          <span className="text-xs text-emerald-600 font-medium">
                            {r.type === 'flowering'
                              ? (language === 'zh' ? '开花' : language === 'ja' ? '開花' : 'Flowering')
                              : (language === 'zh' ? '满开' : language === 'ja' ? '満開' : 'Full Bloom')}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Region Filter */}
              {!loadingBlooming && bloomingCitiesOnDate.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setSelectedRegion("All")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedRegion === "All"
                        ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-pink-50 hover:border-pink-200'
                    }`}
                  >
                    {t('allRegions') || 'All Regions'}
                  </button>
                  {Array.from(new Set(bloomingCitiesOnDate.map(c => c.region))).filter(Boolean).map((region: any) => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedRegion === region
                          ? 'bg-pink-500 border-pink-500 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-pink-50 hover:border-pink-200'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              )}

              {loadingBlooming ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-pink-500 border-t-transparent"></div>
                </div>
              ) : bloomingCitiesOnDate.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 font-medium">{t('noCitiesFound')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {bloomingCitiesOnDate
                    .filter(city => selectedRegion === "All" || city.region === selectedRegion)
                    .map((city: any) => (
                    <div key={city.id} className="bg-slate-50 border border-slate-100 rounded-xl p-5 hover:border-pink-200 transition-colors shadow-sm">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
                        <span className="font-semibold text-slate-900 text-lg">
                          {language === 'zh' || language === 'ja' ? city.jpName : city.name}
                        </span>
                        {/* Display full bloom count as a subtle indicator if needed */}
                      </div>
                      <div className="flex flex-col gap-2">
                        {city.activeForecasts.map((f: any) => {
                          let badgeClass = 'bg-slate-100 text-slate-500';
                          let labelText = '';

                          switch (f.stage) {
                            case 'Full Bloom':
                              badgeClass = 'bg-pink-100 text-pink-700';
                              labelText = t('fullBloom');
                              break;
                            case 'Flowering':
                              badgeClass = 'bg-blue-50 text-blue-600';
                              labelText = t('flowering');
                              break;
                            case 'Not Yet Flowered':
                              badgeClass = 'bg-slate-100 text-slate-500';
                              labelText = t('notYetFlowered');
                              break;
                            case 'Fallen':
                              badgeClass = 'bg-slate-200 text-slate-600';
                              labelText = t('fallen');
                              break;
                          }

                          return (
                            <div key={f.source} className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium w-6/12 truncate">{f.source}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold w-5/12 text-center ${badgeClass}`}>
                                {labelText}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
