import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to parse "M/D" to a Date object for 2026
const parseDateStr = (dateStr?: string) => {
  if (!dateStr || dateStr === '-' || dateStr === 'N/A') return null;
  const [m, d] = dateStr.split('/');
  return new Date(2026, parseInt(m) - 1, parseInt(d));
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const filePath = path.join(process.cwd(), 'app', 'data', 'sakura_forecast_all.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    if (type === 'overview') {
      let globalStart: Date | null = null as any;
      let globalEnd: Date | null = null as any;

      const basicCities = data.cities.map((c: any) => {
        // Calculate global ranges
        c.forecasts.forEach((f: any) => {
          const start = parseDateStr(f.current.floweringDate);
          const fullBloom = parseDateStr(f.current.fullBloomDate);

          if (start) {
            if (!globalStart || start < globalStart) globalStart = start;
            
            const end = fullBloom 
              ? new Date(fullBloom.getTime() + 5 * 24 * 60 * 60 * 1000)
              : new Date(start.getTime() + 10 * 24 * 60 * 60 * 1000);
            
            if (!globalEnd || end > globalEnd) globalEnd = end;
          }
        });

        return {
          id: c.id,
          name: c.name,
          jpName: c.jpName
        };
      });

      return NextResponse.json({
        lastUpdated: data.lastUpdated,
        cities: basicCities,
        globalStart: globalStart ? globalStart.toISOString() : null,
        globalEnd: globalEnd ? globalEnd.toISOString() : null
      });
    }

    if (type === 'city') {
      const cityId = searchParams.get('id');
      if (!cityId) return NextResponse.json({ error: 'City ID required' }, { status: 400 });
      
      const cityData = data.cities.find((c: any) => c.id === cityId);
      if (!cityData) return NextResponse.json({ error: 'City not found' }, { status: 404 });

      return NextResponse.json({
        ...cityData,
        lastUpdated: data.lastUpdated 
      });
    }

    if (type === 'date') {
      const dateParam = searchParams.get('date');
      if (!dateParam) return NextResponse.json({ error: 'Date required' }, { status: 400 });

      const targetDate = new Date(dateParam).getTime();
      const activeCities: any[] = [];

      data.cities.forEach((c: any) => {
        const activeForecasts: any[] = [];

        c.forecasts.forEach((f: any) => {
          const start = parseDateStr(f.current.floweringDate);
          const fullBloom = parseDateStr(f.current.fullBloomDate);

          if (start) {
            const startTime = start.getTime();
            const fullBloomTime = fullBloom ? fullBloom.getTime() : null;
            const endTime = fullBloom 
              ? new Date(fullBloom.getTime() + 5 * 24 * 60 * 60 * 1000).getTime()
              : new Date(start.getTime() + 10 * 24 * 60 * 60 * 1000).getTime();

            if (targetDate >= startTime && targetDate <= endTime) {
              const stage = (fullBloomTime && targetDate >= fullBloomTime) ? 'Full Bloom' : 'Flowering';
              activeForecasts.push({
                source: f.source,
                stage,
                floweringDate: f.current.floweringDate,
                fullBloomDate: f.current.fullBloomDate
              });
            }
          }
        });

        if (activeForecasts.length > 0) {
          activeCities.push({
            id: c.id,
            name: c.name,
            jpName: c.jpName,
            activeForecasts
          });
        }
      });

      // Sort cities by number of "Full Bloom" stages (descending)
      // If tied, sort by Romaji Name ascending
      activeCities.sort((a, b) => {
        const aFullBloomCount = a.activeForecasts.filter((f: any) => f.stage === 'Full Bloom').length;
        const bFullBloomCount = b.activeForecasts.filter((f: any) => f.stage === 'Full Bloom').length;

        if (bFullBloomCount !== aFullBloomCount) {
          return bFullBloomCount - aFullBloomCount;
        }
        return a.name.localeCompare(b.name);
      });

      return NextResponse.json({ cities: activeCities });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

  } catch (error) {
    console.error('Error reading sakura data:', error);
    return NextResponse.json({ error: 'Failed to read sakura data' }, { status: 500 });
  }
}
