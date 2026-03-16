import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'app', 'data', 'sakura_live.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    // Flatten: one row per city per source, for flowering and full bloom separately
    const floweringRows: any[] = [];
    const fullBloomRows: any[] = [];

    data.cities.forEach((city: any) => {
      city.lives.forEach((live: any) => {
        const current = live.current || {};

        if (current.floweringDate) {
          floweringRows.push({
            id: city.id,
            name: city.name,
            jpName: city.jpName,
            region: city.region,
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
            name: city.name,
            jpName: city.jpName,
            region: city.region,
            source: live.source,
            url: live.url,
            date: current.fullBloomDate,
            comparedWithAllYears: current.fullBloomComparedWithAllYears ?? null,
            comparedWithLastYear: current.fullBloomComparedWithLastYear ?? null,
          });
        }
      });
    });

    return NextResponse.json({
      lastUpdated: data.lastUpdated,
      flowering: floweringRows,
      fullBloom: fullBloomRows,
    });
  } catch (error) {
    console.error('Error reading sakura live data:', error);
    return NextResponse.json({ error: 'Failed to read sakura live data' }, { status: 500 });
  }
}
