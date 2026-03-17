import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const liveFilePath = path.join(process.cwd(), 'app', 'data', 'sakura_live.json');
    const forecastFilePath = path.join(process.cwd(), 'app', 'data', 'sakura_forecast_all.json');

    const liveData = JSON.parse(fs.readFileSync(liveFilePath, 'utf8'));
    const forecastData = JSON.parse(fs.readFileSync(forecastFilePath, 'utf8'));

    // Build a lookup: by id and by jpName → { region, name }
    const cityInfoMap: Record<string, { region: string; name: string }> = {};
    for (const city of forecastData.cities) {
      const info = { region: city.region ?? null, name: city.name ?? null };
      if (city.id) cityInfoMap[city.id] = info;
      if (city.jpName) cityInfoMap[city.jpName] = info;
    }

    const resolveInfo = (city: any) =>
      cityInfoMap[city.id] ?? cityInfoMap[city.jpName] ?? { region: city.region, name: city.name };

    // Flatten: one row per city per source, for flowering and full bloom separately
    const floweringRows: any[] = [];
    const fullBloomRows: any[] = [];

    liveData.cities.forEach((city: any) => {
      const { region, name } = resolveInfo(city);

      // Some entries may use "forecasts" instead of "lives" — skip those gracefully
      const lives: any[] = Array.isArray(city.lives) ? city.lives : [];

      lives.forEach((live: any) => {
        const current = live.current || {};

        if (current.floweringDate) {
          floweringRows.push({
            id: city.id,
            name,
            jpName: city.jpName,
            region,
            source: live.source,
            url: live.url,
            date: current.floweringDate,
            comparedWithAllYears: current.comparedWithAllYears ?? null,
            comparedWithLastYear: current.comparedWithLastYear ?? null,
          });
        }

        if (current.fullBloomDate) {
          fullBloomRows.push({
            id: city.id,
            name,
            jpName: city.jpName,
            region,
            source: live.source,
            url: live.url,
            date: current.fullBloomDate,
            comparedWithAllYears: current.fullBloomComparedWithAllYears ?? null,
            comparedWithLastYear: current.fullBloomComparedWithLastYear ?? null,
          });
        }
      });
    });

    // Parse "M/D" style date strings into a sortable number (month * 100 + day)
    const parseMD = (d: string) => {
      const [m, day] = d.split('/').map(Number);
      return (m || 0) * 100 + (day || 0);
    };

    // Sort descending: later bloom date appears first
    floweringRows.sort((a, b) => parseMD(b.date) - parseMD(a.date));
    fullBloomRows.sort((a, b) => parseMD(b.date) - parseMD(a.date));

    return NextResponse.json({
      lastUpdated: liveData.lastUpdated,
      flowering: floweringRows,
      fullBloom: fullBloomRows,
    });
  } catch (error) {
    console.error('Error reading sakura live data:', error);
    return NextResponse.json({ error: 'Failed to read sakura live data' }, { status: 500 });
  }
}
