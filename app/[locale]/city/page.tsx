'use client';

import { useEffect, useState } from 'react';
import { MapPin, Calendar, Map, Search, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../i18n/context';

type SakuraData = {
  flowering: string;
  fullBloom: string;
};

type Forecast = {
  source: string;
  url: string;
  current: {
    floweringDate: string;
    fullBloomDate: string;
  };
};

type LiveEntry = {
  source: string;
  url: string;
  flowering: string | null;
  floweringVsAllYears: string | null;
  floweringVsLastYear: string | null;
  fullBloom: string | null;
  fullBloomVsAllYears: string | null;
  fullBloomVsLastYear: string | null;
};

type LiveCity = {
  id: string;
  name: string;
  jpName: string;
  region: string;
  source: string;
  url: string;
  date: string | null;
  comparedWithAllYears: string | null;
  comparedWithLastYear: string | null;
};

type CityData = {
  id: string;
  name: string;
  jpName: string;
  forecasts?: Forecast[];
  lastUpdated?: Record<string, string>;
  liveData?: { lastUpdated: string; entries: LiveEntry[] } | null;
};

type OverviewResponse = {
  lastUpdated: string;
  cities: CityData[];
  globalStart: string | null;
  globalEnd: string | null;
};

const POPULAR_CITY_IDS = ["sapporo", "tokyo", "kanazawa", "kyoto", "osaka", "fukuoka"];

function DiffBadge({ value, unit, earlierLabel, laterLabel, labelFirst = false }: {
  value: string | null;
  unit: string;
  earlierLabel: string;
  laterLabel: string;
  labelFirst?: boolean;
}) {
  if (!value) return <span className="text-slate-300 text-xs">—</span>;
  const num = parseInt(value, 10);
  if (isNaN(num)) return <span className="text-slate-300 text-xs">—</span>;
  const abs = Math.abs(num);
  const isEarly = num < 0;
  const isLate = num > 0;
  const cls = isEarly
    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : isLate
    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
    : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600';
  const label = isEarly ? earlierLabel : isLate ? laterLabel : '±0';
  const arrow = isEarly ? '▲' : isLate ? '▼' : '';
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {arrow}{labelFirst ? `${label}${abs}${unit}` : `${abs}${unit} ${label}`}
    </span>
  );
}

const RECOMMENDED_SPOTS: Record<string, { en: string, jp: string }[]> = {
  kyoto: [
    { en: "Arashiyama", jp: "嵐山" },
    { en: "Philosopher's Path", jp: "哲学の道" },
    { en: "Maruyama Park", jp: "円山公園" },
    { en: "Kiyomizu-dera", jp: "清水寺" }
  ],
  tokyo: [
    { en: "Shinjuku Gyoen", jp: "新宿御苑" },
    { en: "Ueno Park", jp: "上野恩賜公園" },
    { en: "Chidorigafuchi", jp: "千鳥ヶ淵" },
    { en: "Meguro River", jp: "目黒川" }
  ],
  osaka: [
    { en: "Osaka Castle Park", jp: "大阪城公園" },
    { en: "Kema Sakuranomiya Park", jp: "毛馬桜之宮公園" },
    { en: "Expo '70 Commemorative Park", jp: "万博記念公园" },
    { en: "Mint Bureau", jp: "造幣局" }
  ]
};

export default function CitySearch() {
  const { t, language } = useLanguage();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedCityData, setSelectedCityData] = useState<CityData | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [liveReport, setLiveReport] = useState<{ flowering: LiveCity[]; fullBloom: LiveCity[] } | null>(null);

  useEffect(() => {
    fetch('/api/sakura?type=overview')
      .then(res => res.json())
      .then(data => {
        setOverview(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedCityId) {
      fetch(`/api/sakura?type=city&id=${selectedCityId}`)
        .then(res => res.json())
        .then(data => setSelectedCityData(data))
        .catch(console.error);
    }
  }, [selectedCityId]);

  useEffect(() => {
    fetch('/api/sakura-live')
      .then(res => res.json())
      .then(data => setLiveReport(data))
      .catch(console.error);
  }, []);

  const availableCities = overview?.cities || [];
  const filteredCities = availableCities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.jpName.includes(searchQuery)
  );

  const getSourceData = (sourceName: string) => {
    const forecast = selectedCityData?.forecasts?.find((f) => f.source === sourceName)?.current;
    return forecast ? { flowering: forecast.floweringDate, fullBloom: forecast.fullBloomDate } : undefined;
  };

  const cityData = {
    weathermap: getSourceData("Weather Map"),
    weathernews: getSourceData("Weathernews"),
    jmc: getSourceData("Japan Meteorological Corp"),
    tenki: getSourceData("tenki.jp"),
  };

  const parseDateStr = (dateStr?: string) => {
    if (!dateStr || dateStr === '-' || dateStr === 'N/A') return null;
    const [m, d] = dateStr.split('/');
    return new Date(2026, parseInt(m) - 1, parseInt(d));
  };

  const getViewingPeriod = (sourceData?: SakuraData) => {
    const start = parseDateStr(sourceData?.flowering);
    const fullBloom = parseDateStr(sourceData?.fullBloom);
    if (!start) return null;
    
    const end = fullBloom 
      ? new Date(fullBloom.getTime() + 5 * 24 * 60 * 60 * 1000)
      : new Date(start.getTime() + 10 * 24 * 60 * 60 * 1000);
      
    return { start, end };
  };

  const periods = {
    weathermap: getViewingPeriod(cityData.weathermap),
    weathernews: getViewingPeriod(cityData.weathernews),
    jmc: getViewingPeriod(cityData.jmc),
    tenki: getViewingPeriod(cityData.tenki),
  };

  const isDateInPeriod = (date: Date, period: { start: Date, end: Date } | null) => {
    if (!period) return false;
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const start = new Date(period.start.getFullYear(), period.start.getMonth(), period.start.getDate()).getTime();
    const end = new Date(period.end.getFullYear(), period.end.getMonth(), period.end.getDate()).getTime();
    return compareDate >= start && compareDate <= end;
  };

  const renderMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const monthName = new Date(year, month).toLocaleString(language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'en-US', { month: 'long' });

    return (
      <div className="flex-1 min-w-[250px]">
        <h4 className="text-center font-semibold text-slate-800 dark:text-slate-200 mb-4 text-lg">{year} {monthName}</h4>
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(d => (
            <div key={d} className="text-slate-400 dark:text-slate-500 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-sm">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-10"></div>;
            
            const currentDate = new Date(year, month, day);
            const inWm = isDateInPeriod(currentDate, periods.weathermap);
            const inWn = isDateInPeriod(currentDate, periods.weathernews);
            const inJmc = isDateInPeriod(currentDate, periods.jmc);
            const inTenki = isDateInPeriod(currentDate, periods.tenki);
            const hasAny = inWm || inWn || inJmc || inTenki;

            return (
              <div key={day} className="h-10 flex flex-col items-center justify-start relative group">
                <span className={`z-10 w-7 h-7 flex items-center justify-center rounded-full ${hasAny ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                  {day}
                </span>
                <div className="absolute bottom-0 w-full flex flex-col gap-[2px] px-1.5">
                  {inWm && <div className="h-1 w-full bg-[#4A90E2] rounded-full"></div>}
                  {inWn && <div className="h-1 w-full bg-[#F5A623] rounded-full"></div>}
                  {inJmc && <div className="h-1 w-full bg-[#2ECC71] rounded-full"></div>}
                  {inTenki && <div className="h-1 w-full bg-[#9B59B6] rounded-full"></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* City Search and Selection */}
      <div className="mb-10 max-w-2xl">
        <div className="relative z-20">
          <div className="relative flex items-center">
            <MapPin className="absolute left-4 h-5 w-5 text-pink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              placeholder={t('searchPlaceholder')}
              className="block w-full pl-11 pr-4 py-4 text-lg border border-pink-200 dark:border-pink-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded-2xl bg-white dark:bg-[#231c2a] shadow-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-shadow hover:shadow-md"
            />
            <Search className="absolute right-4 h-5 w-5 text-slate-400" />
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && searchQuery && (
            <div className="absolute w-full mt-2 bg-white dark:bg-[#231c2a] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-h-80 overflow-y-auto">
              {filteredCities.length === 0 ? (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">{t('noSearchFound')}</div>
              ) : (
                <ul className="py-2">
                  {filteredCities.map(city => (
                    <li key={city.id}>
                      <button
                        onClick={() => {
                          setSelectedCityId(city.id);
                          setSearchQuery('');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-pink-50 dark:hover:bg-pink-900/20 flex items-center justify-between transition-colors"
                      >
                        <span className="font-medium text-slate-900 dark:text-slate-100">{city.name}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{city.jpName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Quick Select Chips */}
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <div className="text-sm font-medium text-slate-400 dark:text-slate-500 mr-2">
            {t('popular')}
          </div>
          {availableCities.filter(c => POPULAR_CITY_IDS.includes(c.id)).map((city) => (
            <button
              key={city.id}
              onClick={() => setSelectedCityId(city.id)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-all ${
                selectedCityId === city.id
                  ? 'bg-pink-500 border-pink-500 text-white font-medium shadow-sm'
                  : 'bg-white dark:bg-[#231c2a] border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-200 hover:text-pink-700'
              }`}
            >
              {language === 'zh' || language === 'ja' ? city.jpName : city.name}
            </button>
          ))}
        </div>
      </div>

      {!selectedCityId ? (
        <div className="animate-in fade-in duration-500">
          {/* Live Announcement Cards */}
          {(() => {
            const flowering = liveReport?.flowering ?? [];
            const fullBloom = liveReport?.fullBloom ?? [];
            const hasAny = flowering.length > 0 || fullBloom.length > 0;

            if (!hasAny) {
              return (
                <div className="text-center py-20 bg-white dark:bg-[#231c2a] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  {liveReport ? t('liveDefaultEmpty') : t('pleaseSearch')}
                </div>
              );
            }

            return (
              <div className="space-y-8">
                {/* Section header */}
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">{t('liveDefaultTitle')}</h2>
                </div>

                {/* Flowering Cards */}
                {flowering.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🌸</span>
                      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">{t('liveDefaultFlowering')}</h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{flowering.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {flowering.map(city => (
                        <button
                          key={city.id}
                          onClick={() => setSelectedCityId(city.id)}
                          className="text-left bg-white dark:bg-[#231c2a] border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-lg group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {language === 'en' ? city.name : city.jpName}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500">{city.region}</div>
                            </div>
                            <span className="text-2xl font-bold text-pink-500">{city.date}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <DiffBadge
                              value={city.comparedWithAllYears}
                              unit={t('liveDaysUnit')}
                              earlierLabel={t('liveEarlier')}
                              laterLabel={t('liveLater')}
                              labelFirst={language === 'zh'}
                            />
                            <DiffBadge
                              value={city.comparedWithLastYear}
                              unit={t('liveDaysUnit')}
                              earlierLabel={t('liveEarlier')}
                              laterLabel={t('liveLater')}
                              labelFirst={language === 'zh'}
                            />
                          </div>
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('liveDefaultClickHint')} →</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Bloom Cards */}
                {fullBloom.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">💮</span>
                      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">{t('liveDefaultFullBloom')}</h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{fullBloom.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {fullBloom.map(city => (
                        <button
                          key={city.id}
                          onClick={() => setSelectedCityId(city.id)}
                          className="text-left bg-white dark:bg-[#231c2a] border border-pink-100 dark:border-pink-900/30 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-pink-300 dark:hover:border-pink-700 transition-all group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-lg group-hover:text-pink-700 dark:group-hover:text-pink-400 transition-colors">
                                {language === 'en' ? city.name : city.jpName}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500">{city.region}</div>
                            </div>
                            <span className="text-2xl font-bold text-pink-500">{city.date}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <DiffBadge
                              value={city.comparedWithAllYears}
                              unit={t('liveDaysUnit')}
                              earlierLabel={t('liveEarlier')}
                              laterLabel={t('liveLater')}
                              labelFirst={language === 'zh'}
                            />
                            <DiffBadge
                              value={city.comparedWithLastYear}
                              unit={t('liveDaysUnit')}
                              earlierLabel={t('liveEarlier')}
                              laterLabel={t('liveLater')}
                              labelFirst={language === 'zh'}
                            />
                          </div>
                          <div className="text-xs text-pink-600 dark:text-pink-400 font-medium">{t('liveDefaultClickHint')} →</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {selectedCityData?.name || t('loading')} <span className="text-2xl text-slate-400 font-medium">({selectedCityData?.jpName || ""})</span>
            </h1>
            <button
              onClick={() => { setSelectedCityId(""); setSelectedCityData(null); }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-[#231c2a] border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
              title="Clear selection"
            >
              <span className="text-base leading-none">✕</span>
              <span>{language === 'zh' ? '取消选择' : language === 'ja' ? '選択解除' : 'Clear'}</span>
            </button>
          </div>
          
          {/* Official JMA Live Announcement Banner */}
          {selectedCityData?.liveData && selectedCityData.liveData.entries.length > 0 && (() => {
            const entries = selectedCityData.liveData!.entries;
            const hasFlowering = entries.some(e => e.flowering);
            const hasFullBloom = entries.some(e => e.fullBloom);
            if (!hasFlowering && !hasFullBloom) return null;
            return (
              <div className="mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h2 className="text-base font-bold text-emerald-800 dark:text-emerald-400">{t('liveAnnouncementTitle')}</h2>
                  <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {selectedCityData.liveData!.lastUpdated}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hasFlowering && entries.filter(e => e.flowering).map((entry, i) => (
                    <div key={`f-${i}`} className="bg-white/80 dark:bg-[#2a2335]/80 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/40">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🌸</span>
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">{t('liveAnnouncedFlowering')}</span>
                        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-emerald-400 hover:text-emerald-600 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">{entry.flowering}</div>
                      <div className="flex flex-wrap gap-2">
                        <DiffBadge
                          value={entry.floweringVsAllYears}
                          unit={t('liveDaysUnit')}
                          earlierLabel={t('liveEarlier')}
                          laterLabel={t('liveLater')}
                          labelFirst={language === 'zh'}
                        />
                        <DiffBadge
                          value={entry.floweringVsLastYear}
                          unit={t('liveDaysUnit')}
                          earlierLabel={t('liveEarlier')}
                          laterLabel={t('liveLater')}
                          labelFirst={language === 'zh'}
                        />
                      </div>
                      <div className="mt-2 flex gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                        {entry.floweringVsAllYears && <span>{t('liveColVsNormal')}</span>}
                        {entry.floweringVsAllYears && entry.floweringVsLastYear && <span>·</span>}
                        {entry.floweringVsLastYear && <span>{t('liveColVsLastYear')}</span>}
                      </div>
                    </div>
                  ))}
                  {hasFullBloom && entries.filter(e => e.fullBloom).map((entry, i) => (
                    <div key={`fb-${i}`} className="bg-white/80 dark:bg-[#2a2335]/80 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/40">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">💮</span>
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">{t('liveAnnouncedFullBloom')}</span>
                        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-emerald-400 hover:text-emerald-600 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">{entry.fullBloom}</div>
                      <div className="flex flex-wrap gap-2">
                        <DiffBadge
                          value={entry.fullBloomVsAllYears}
                          unit={t('liveDaysUnit')}
                          earlierLabel={t('liveEarlier')}
                          laterLabel={t('liveLater')}
                          labelFirst={language === 'zh'}
                        />
                        <DiffBadge
                          value={entry.fullBloomVsLastYear}
                          unit={t('liveDaysUnit')}
                          earlierLabel={t('liveEarlier')}
                          laterLabel={t('liveLater')}
                          labelFirst={language === 'zh'}
                        />
                      </div>
                      <div className="mt-2 flex gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                        {entry.fullBloomVsAllYears && <span>{t('liveColVsNormal')}</span>}
                        {entry.fullBloomVsAllYears && entry.fullBloomVsLastYear && <span>·</span>}
                        {entry.fullBloomVsLastYear && <span>{t('liveColVsLastYear')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Forecast Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Weather Map */}
            <div className="bg-white dark:bg-[#231c2a] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start min-h-[56px] mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg leading-tight">Weather Map</h3>
              </div>
              <div className="text-xs text-slate-400 font-medium mb-4 flex items-center justify-between">
                <span>{t('lastUpdatedLabel') || 'Updated'}:</span>
                <span>{selectedCityData?.lastUpdated?.weatherMap || '-'}</span>
              </div>
              <div className="space-y-4">
                <div className="bg-[#fff5f7] dark:bg-pink-950/20 rounded-xl p-4 border border-pink-50 dark:border-pink-900/20">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span>🌸</span> {t('flowering')} {t('floweringSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {!selectedCityData ? '...' : cityData.weathermap?.flowering || '-'}
                  </div>
                </div>
                <div className="bg-[#fff5f7] dark:bg-pink-950/20 rounded-xl p-4 border border-pink-50 dark:border-pink-900/20">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span className="text-pink-400">💮</span> {t('fullBloom')} {t('fullBloomSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {!selectedCityData ? '...' : cityData.weathermap?.fullBloom || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Weathernews */}
            <div className="bg-white dark:bg-[#231c2a] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start min-h-[56px] mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg leading-tight">Weathernews</h3>
              </div>
              <div className="text-xs text-slate-400 font-medium mb-4 flex items-center justify-between">
                <span>{t('lastUpdatedLabel') || 'Updated'}:</span>
                <span>{selectedCityData?.lastUpdated?.weathernews || '-'}</span>
              </div>
              <div className="space-y-4">
                <div className="bg-[#fff5f7] dark:bg-pink-950/20 rounded-xl p-4 border border-pink-50 dark:border-pink-900/20">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span>🌸</span> {t('flowering')} {t('floweringSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {!selectedCityData ? '...' : cityData.weathernews?.flowering || '-'}
                  </div>
                </div>
                <div className="bg-[#fff5f7] dark:bg-pink-950/20 rounded-xl p-4 border border-pink-50 dark:border-pink-900/20">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span className="text-pink-400">💮</span> {t('fullBloom')} {t('fullBloomSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {!selectedCityData ? '...' : cityData.weathernews?.fullBloom || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Japan Meteorological Corp */}
            <div className="bg-white dark:bg-[#231c2a] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start min-h-[56px] mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg leading-tight">Japan Meteorological<br/>Corp</h3>
              </div>
              <div className="text-xs text-slate-400 font-medium mb-4 flex items-center justify-between">
                <span>{t('lastUpdatedLabel') || 'Updated'}:</span>
                <span>{selectedCityData?.lastUpdated?.japanMeteorologicalCorp || '-'}</span>
              </div>
              <div className="space-y-4">
                <div className="bg-[#fff5f7] dark:bg-pink-950/20 rounded-xl p-4 border border-pink-50 dark:border-pink-900/20">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span>🌸</span> {t('flowering')} {t('floweringSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {!selectedCityData ? '...' : cityData.jmc?.flowering || '-'}
                  </div>
                </div>
                <div className="bg-[#fff5f7] dark:bg-pink-950/20 rounded-xl p-4 border border-pink-50 dark:border-pink-900/20">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span className="text-pink-400">💮</span> {t('fullBloom')} {t('fullBloomSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {!selectedCityData ? '...' : cityData.jmc?.fullBloom || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* tenki.jp */}
            <div className="bg-white dark:bg-[#231c2a] rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start min-h-[56px] mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg leading-tight">tenki.jp</h3>
              </div>
              <div className="text-xs text-slate-400 font-medium mb-4 flex items-center justify-between">
                <span>{t('lastUpdatedLabel') || 'Updated'}:</span>
                <span>{selectedCityData?.lastUpdated?.['tenki.jp'] || '-'}</span>
              </div>
              <div className="space-y-4">
                <div className="bg-[#fff5f7] dark:bg-pink-950/20 rounded-xl p-4 border border-pink-50 dark:border-pink-900/20">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span>🌸</span> {t('flowering')} {t('floweringSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {!selectedCityData ? '...' : cityData.tenki?.flowering || '-'}
                  </div>
                </div>
                <div className="bg-[#fff5f7] dark:bg-pink-950/20 rounded-xl p-4 border border-pink-50 dark:border-pink-900/20">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span className="text-pink-400">💮</span> {t('fullBloom')} {t('fullBloomSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {!selectedCityData ? '...' : cityData.tenki?.fullBloom || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Spots */}
          {(RECOMMENDED_SPOTS[selectedCityId] || []).length > 0 && (
            <div className="bg-white dark:bg-[#231c2a] rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Map className="w-6 h-6 text-pink-500" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('recommendedSpots')} {selectedCityData?.name || "..."}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {RECOMMENDED_SPOTS[selectedCityId].map((spot, idx) => (
                  <div key={idx} className="border border-slate-100 dark:border-slate-700 rounded-xl p-5 hover:border-pink-200 dark:hover:border-pink-700 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-lg mb-1">{spot.en}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{spot.jp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Viewing Period Calendar */}
          <div className="bg-white dark:bg-[#231c2a] rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-slate-700" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('calendarTitle')}</h2>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-3xl">
              {t('calendarDesc')} <strong className="text-slate-800 dark:text-slate-200">{t('calendarDescBold1')}</strong> {t('calendarDescAnd')} <strong className="text-slate-800 dark:text-slate-200">{t('calendarDescBold2')}</strong>.
            </p>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 mb-10">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#4A90E2]"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Weather Map</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#F5A623]"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Weathernews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#2ECC71]"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Japan Meteorological Corp</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#9B59B6]"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">tenki.jp</span>
              </div>
            </div>

            {/* Calendars */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 justify-between">
              {renderMonth(2026, 2)} {/* March */}
              {renderMonth(2026, 3)} {/* April */}
              {renderMonth(2026, 4)} {/* May */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
