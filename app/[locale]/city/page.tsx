'use client';

import { useEffect, useState } from 'react';
import { MapPin, Calendar, Map, Search } from 'lucide-react';
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

type CityData = {
  id: string;
  name: string;
  jpName: string;
  forecasts?: Forecast[];
  lastUpdated?: Record<string, string>;
};

type OverviewResponse = {
  lastUpdated: string;
  cities: CityData[];
  globalStart: string | null;
  globalEnd: string | null;
};

const POPULAR_CITY_IDS = ["sapporo", "tokyo", "kanazawa", "kyoto", "osaka", "fukuoka"];

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
            const inWm = isDateInPeriod(currentDate, periods.weathermap);
            const inWn = isDateInPeriod(currentDate, periods.weathernews);
            const inJmc = isDateInPeriod(currentDate, periods.jmc);
            const hasAny = inWm || inWn || inJmc;

            return (
              <div key={day} className="h-10 flex flex-col items-center justify-start relative group">
                <span className={`z-10 w-7 h-7 flex items-center justify-center rounded-full ${hasAny ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                  {day}
                </span>
                <div className="absolute bottom-0 w-full flex flex-col gap-[2px] px-1.5">
                  {inWm && <div className="h-1 w-full bg-[#4A90E2] rounded-full"></div>}
                  {inWn && <div className="h-1 w-full bg-[#F5A623] rounded-full"></div>}
                  {inJmc && <div className="h-1 w-full bg-[#2ECC71] rounded-full"></div>}
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
              className="block w-full pl-11 pr-4 py-4 text-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded-2xl bg-white shadow-sm text-slate-900 transition-shadow hover:shadow-md"
            />
            <Search className="absolute right-4 h-5 w-5 text-slate-400" />
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && searchQuery && (
            <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto">
              {filteredCities.length === 0 ? (
                <div className="p-4 text-center text-slate-500">{t('noSearchFound')}</div>
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
                        className="w-full text-left px-4 py-3 hover:bg-pink-50 flex items-center justify-between transition-colors"
                      >
                        <span className="font-medium text-slate-900">{city.name}</span>
                        <span className="text-sm text-slate-500">{city.jpName}</span>
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
          <div className="text-sm font-medium text-slate-400 mr-2">
            {t('popular')}
          </div>
          {availableCities.filter(c => POPULAR_CITY_IDS.includes(c.id)).map((city) => (
            <button
              key={city.id}
              onClick={() => setSelectedCityId(city.id)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-all ${
                selectedCityId === city.id
                  ? 'bg-pink-500 border-pink-500 text-white font-medium shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-700'
              }`}
            >
              {language === 'zh' || language === 'ja' ? city.jpName : city.name}
            </button>
          ))}
        </div>
      </div>

      {!selectedCityId ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100 italic text-slate-500">
          {t('pleaseSearch')}
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex items-center gap-3">
             <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              {selectedCityData?.name || t('loading')} <span className="text-2xl text-slate-400 font-medium">({selectedCityData?.jpName || ""})</span>
            </h1>
          </div>
          
          {/* Forecast Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Weather Map */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-800 text-lg">Weather Map</h3>
              </div>
              <div className="text-xs text-slate-400 font-medium mb-4 flex items-center justify-between">
                <span>{t('lastUpdatedLabel') || 'Updated'}:</span>
                <span>{selectedCityData?.lastUpdated?.weatherMap || '-'}</span>
              </div>
              <div className="space-y-4">
                <div className="bg-[#fff5f7] rounded-xl p-4 border border-pink-50">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span>🌸</span> {t('flowering')} {t('floweringSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    {!selectedCityData ? '...' : cityData.weathermap?.flowering || '-'}
                  </div>
                </div>
                <div className="bg-[#fff5f7] rounded-xl p-4 border border-pink-50">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span className="text-pink-400">💮</span> {t('fullBloom')} {t('fullBloomSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    {!selectedCityData ? '...' : cityData.weathermap?.fullBloom || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Weathernews */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-800 text-lg">Weathernews</h3>
              </div>
              <div className="text-xs text-slate-400 font-medium mb-4 flex items-center justify-between">
                <span>{t('lastUpdatedLabel') || 'Updated'}:</span>
                <span>{selectedCityData?.lastUpdated?.weathernews || '-'}</span>
              </div>
              <div className="space-y-4">
                <div className="bg-[#fff5f7] rounded-xl p-4 border border-pink-50">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span>🌸</span> {t('flowering')} {t('floweringSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    {!selectedCityData ? '...' : cityData.weathernews?.flowering || '-'}
                  </div>
                </div>
                <div className="bg-[#fff5f7] rounded-xl p-4 border border-pink-50">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span className="text-pink-400">💮</span> {t('fullBloom')} {t('fullBloomSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    {!selectedCityData ? '...' : cityData.weathernews?.fullBloom || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Japan Meteorological Corp */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-slate-800 text-lg leading-tight">Japan Meteorological<br/>Corp</h3>
              </div>
              <div className="text-xs text-slate-400 font-medium mb-4 flex items-center justify-between">
                <span>{t('lastUpdatedLabel') || 'Updated'}:</span>
                <span>{selectedCityData?.lastUpdated?.japanMeteorologicalCorp || '-'}</span>
              </div>
              <div className="space-y-4">
                <div className="bg-[#fff5f7] rounded-xl p-4 border border-pink-50">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span>🌸</span> {t('flowering')} {t('floweringSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    {!selectedCityData ? '...' : cityData.jmc?.flowering || '-'}
                  </div>
                </div>
                <div className="bg-[#fff5f7] rounded-xl p-4 border border-pink-50">
                  <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                    <span className="text-pink-400">💮</span> {t('fullBloom')} {t('fullBloomSub')}
                  </div>
                  <div className="text-3xl font-bold text-slate-800">
                    {!selectedCityData ? '...' : cityData.jmc?.fullBloom || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Spots */}
          {(RECOMMENDED_SPOTS[selectedCityId] || []).length > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Map className="w-6 h-6 text-pink-500" />
                <h2 className="text-2xl font-bold text-slate-900">{t('recommendedSpots')} {selectedCityData?.name || "..."}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {RECOMMENDED_SPOTS[selectedCityId].map((spot, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-xl p-5 hover:border-pink-200 transition-colors bg-slate-50/50">
                    <div className="font-semibold text-slate-800 text-lg mb-1">{spot.en}</div>
                    <div className="text-sm text-slate-500">{spot.jp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Viewing Period Calendar */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-slate-700" />
              <h2 className="text-2xl font-bold text-slate-900">{t('calendarTitle')}</h2>
            </div>
            
            <p className="text-slate-600 mb-6 max-w-3xl">
              {t('calendarDesc')} <strong className="text-slate-800">{t('calendarDescBold1')}</strong> {t('calendarDescAnd')} <strong className="text-slate-800">{t('calendarDescBold2')}</strong>.
            </p>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 mb-10">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#4A90E2]"></div>
                <span className="text-sm font-medium text-slate-700">Weather Map</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#F5A623]"></div>
                <span className="text-sm font-medium text-slate-700">Weathernews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#2ECC71]"></div>
                <span className="text-sm font-medium text-slate-700">Japan Meteorological Corp</span>
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
