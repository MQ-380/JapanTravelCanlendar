// @ts-nocheck
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, ExternalLink, Search, Info, Navigation, Calendar, Clock, Map } from 'lucide-react';
import _sakuraData from '../app/data/sakura_forecast_all.json';

const sakuraData: any = {
  ..._sakuraData,
  sourceUpdates: {
    "Weather Map": "2026-03-05",
    "Weathernews": "2026-03-05",
    "Japan Meteorological Corp": "2026-03-05"
  }
};

const SOURCE_COLORS: Record<string, string> = {
  'Weather Map': 'bg-blue-400',
  'Weathernews': 'bg-amber-400',
  'Japan Meteorological Corp': 'bg-emerald-400'
};

function parseDateStr(str: string, year = 2026): Date | null {
  if (!str || str === 'N/A' || str === 'Error' || str === '...') return null;
  
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const s = str.toLowerCase();
  
  let m = -1;
  for (let i = 0; i < monthNames.length; i++) {
    if (s.includes(monthNames[i])) {
      m = i;
      break;
    }
  }
  
  if (m !== -1) {
    const numMatch = s.match(/\b(\d{1,2})\b/);
    if (numMatch) {
      const d = parseInt(numMatch[1], 10);
      if (d >= 1 && d <= 31) {
        return new Date(year, m, d);
      }
    }
  }
  
  const match2 = str.match(/(?:^|[^\d])(\d{1,2})\/(\d{1,2})(?:[^\d]|$)/);
  if (match2) {
    const m = parseInt(match2[1], 10) - 1;
    const d = parseInt(match2[2], 10);
    if (m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return new Date(year, m, d);
    }
  }
  
  return null;
}

export default function SakuraDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(sakuraData.cities[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return sakuraData.cities;
    return sakuraData.cities.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.jpName.includes(searchQuery)
    );
  }, [searchQuery]);

  const validPeriods = useMemo(() => {
    if (!selectedCity) return [];
    return selectedCity.forecasts.map(f => {
      const start = parseDateStr(f.current.floweringDate);
      const peak = parseDateStr(f.current.fullBloomDate);
      if (!start || !peak) return null;
      
      const end = new Date(peak);
      end.setDate(end.getDate() + 5);
      
      return {
        source: f.source,
        start,
        end,
        color: SOURCE_COLORS[f.source] || 'bg-pink-400'
      };
    }).filter(Boolean) as { source: string, start: Date, end: Date, color: string }[];
  }, [selectedCity]);

  const handleSelectCity = (city: any) => {
    setSelectedCity(city);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const lastUpdatedDate = new Date(sakuraData.lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-slate-800 font-sans selection:bg-pink-200 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-pink-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <h1 className="text-xl font-medium tracking-tight text-pink-950">
              Sakura Forecast <span className="text-pink-400 font-light">Aggregator</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Updated {lastUpdatedDate}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Search Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight mb-4">
              When will the sakura bloom?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Select a major city to compare the latest forecasts and discover recommended viewing spots.
            </p>
          </div>

          <div className="relative">
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
                placeholder="Search for a city (e.g., Tokyo, Kyoto, Sapporo)"
                className="block w-full pl-11 pr-4 py-4 text-lg border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded-2xl bg-white shadow-sm text-slate-900 transition-shadow hover:shadow-md"
              />
              <Search className="absolute right-4 h-5 w-5 text-slate-400" />
            </div>

            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto"
                >
                  {filteredCities.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">No cities found.</div>
                  ) : (
                    <ul className="py-2">
                      {filteredCities.map(city => (
                        <li key={city.id}>
                          <button
                            onClick={() => handleSelectCity(city)}
                            className="w-full text-left px-4 py-3 hover:bg-pink-50 flex items-center justify-between transition-colors"
                          >
                            <span className="font-medium text-slate-900">{city.name}</span>
                            <span className="text-sm text-slate-500">{city.jpName}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Select Chips */}
          <div className="mt-6">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1 justify-center">
              <Navigation className="h-3 w-3" /> Popular Destinations
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {sakuraData.cities.slice(0, 6).map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className={`px-4 py-2 text-sm rounded-xl border transition-all ${
                    selectedCity.id === city.id
                      ? 'bg-pink-500 border-pink-500 text-white font-medium shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-700'
                  }`}
                >
                  {city.name} <span className={`text-xs ml-1 ${selectedCity.id === city.id ? 'opacity-80' : 'opacity-60'}`}>{city.jpName}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Results Area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {selectedCity && (
              <motion.div
                key={selectedCity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8"
              >
                <div className="flex items-center justify-between border-b border-pink-200 pb-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-pink-500" />
                    {selectedCity.name} <span className="text-slate-400 font-normal text-xl">({selectedCity.jpName})</span>
                  </h2>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab('current')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'current' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                  >
                    Current Forecast
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-pink-500 text-pink-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                  >
                    Prediction History
                  </button>
                </div>

                {/* Forecast Cards or History Table */}
                {activeTab === 'current' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {selectedCity.forecasts.map((forecast, index) => (
                    <motion.div
                      key={forecast.source}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col relative"
                    >
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-medium text-slate-900 leading-tight">
                              {forecast.source}
                            </h3>
                            <div className="text-xs text-slate-400 mt-1">
                              Updated: {sakuraData.sourceUpdates[forecast.source as keyof typeof sakuraData.sourceUpdates]}
                            </div>
                          </div>
                          <a 
                            href={forecast.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-pink-500 transition-colors shrink-0 ml-4"
                            title="Visit source"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                        
                        <div className="space-y-4 mt-auto">
                          <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-100/50 group-hover:bg-pink-50 transition-colors">
                            <div className="flex items-center gap-2 text-sm text-pink-600 mb-1 font-medium">
                              <span className="text-lg">🌸</span> Flowering (開花)
                            </div>
                            <div className="text-2xl font-semibold text-slate-900">
                              {forecast.current.floweringDate}
                            </div>
                          </div>
                          
                          <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-100/50 group-hover:bg-pink-50 transition-colors">
                            <div className="flex items-center gap-2 text-sm text-pink-600 mb-1 font-medium">
                              <span className="text-lg">💮</span> Full Bloom (満開)
                            </div>
                            <div className="text-2xl font-semibold text-slate-900">
                              {forecast.current.fullBloomDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 overflow-hidden"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4 font-medium">Source</th>
                            <th className="px-6 py-4 font-medium">Update Date</th>
                            <th className="px-6 py-4 font-medium">Flowering</th>
                            <th className="px-6 py-4 font-medium">Full Bloom</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedCity.forecasts.flatMap((f: any) => 
                            (f.history || []).map((h: any, i: number) => (
                              <tr key={`${f.source}-${i}`} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                  {i === 0 ? f.source : ''}
                                </td>
                                <td className="px-6 py-4 text-slate-600">{h.date}</td>
                                <td className="px-6 py-4 text-slate-600">{h.floweringDate}</td>
                                <td className="px-6 py-4 text-slate-600">{h.fullBloomDate}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* Recommended Spots */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 sm:p-8"
                >
                  <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Map className="h-5 w-5 text-pink-500" />
                    Recommended Spots in {selectedCity.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedCity.spots.map((spot, idx) => (
                      <div key={idx} className="flex flex-col p-4 rounded-xl bg-pink-50/30 border border-pink-100 hover:border-pink-300 hover:bg-pink-50 transition-colors">
                        <span className="font-medium text-slate-900">{spot.name}</span>
                        <span className="text-sm text-slate-500 mt-1">{spot.jpName}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Calendar Section */}
                {validPeriods.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 sm:p-8"
                  >
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🗓️</span> Best Viewing Period Calendar
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                        The highlighted dates show the estimated best viewing period for each source, calculated from the <strong>flowering date</strong> to <strong>5 days after full bloom</strong>. 
                      </p>
                      <div className="flex flex-wrap gap-6 mt-5">
                        {selectedCity.forecasts.map(s => (
                          <div key={s.source} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <div className={`w-4 h-4 rounded-full ${SOURCE_COLORS[s.source] || 'bg-pink-400'}`}></div>
                            {s.source}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {[
                        { month: 2, name: 'March', days: 31, startDay: new Date(2026, 2, 1).getDay() },
                        { month: 3, name: 'April', days: 30, startDay: new Date(2026, 3, 1).getDay() },
                        { month: 4, name: 'May', days: 31, startDay: new Date(2026, 4, 1).getDay() }
                      ].map(m => (
                        <div key={m.name} className="flex flex-col">
                          <h4 className="text-lg font-medium text-slate-800 mb-4 text-center">{m.name} 2026</h4>
                          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: m.startDay }).map((_, i) => (
                              <div key={`empty-${i}`} className="aspect-square rounded-lg bg-slate-50"></div>
                            ))}
                            {Array.from({ length: m.days }).map((_, i) => {
                              const day = i + 1;
                              const currentDate = new Date(2026, m.month, day).getTime();
                              const activePeriods = validPeriods.filter(p => {
                                const s = new Date(p.start.getFullYear(), p.start.getMonth(), p.start.getDate()).getTime();
                                const e = new Date(p.end.getFullYear(), p.end.getMonth(), p.end.getDate()).getTime();
                                return currentDate >= s && currentDate <= e;
                              });
                              
                              return (
                                <div key={day} className="aspect-square rounded-lg border border-slate-100 p-1 relative flex flex-col items-center justify-start bg-white overflow-hidden">
                                  <span className={`text-xs z-10 ${activePeriods.length > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                                    {day}
                                  </span>
                                  <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-[2px]">
                                    {activePeriods.map((p, idx) => (
                                      <div key={idx} className={`h-1.5 w-full rounded-sm ${p.color} opacity-90`}></div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
