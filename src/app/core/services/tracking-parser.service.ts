import { Service } from '@angular/core';
import { TrackingPoint } from '../models/tracking.model';

@Service()
export class TrackingParserService {
  parseFile(content: string, fileName: string): TrackingPoint[] {
    if (fileName.endsWith('.json')) {
      return JSON.parse(content) as TrackingPoint[];
    } else if (fileName.endsWith('.csv')) {
      return this.parseCSVContent(content);
    }
    throw new Error('Unsupported file format');
  }

  private parseCSVContent(csvText: string): TrackingPoint[] {
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const points: TrackingPoint[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        record[h] = values[idx] ?? '';
      });

      points.push({
        id: record['id'] || `imported_${i}`,
        individualId: record['individual'] || record['individualid'] || 'Unknown',
        timestamp: record['timestamp'] || new Date().toISOString(),
        latitude: Number(record['latitude']) || 0,
        longitude: Number(record['longitude']) || 0,
        accuracyMeters: Number(record['accuracy'] || record['accuracymeters']) || 10,
        speedKmH: Number(record['speed'] || record['speedkmh']) || 0,
        isFlagged: record['flagged'] === 'true',
        flagReason: record['flagreason'] || '',
        manuallyOverridden: false,
      });
    }

    return points;
  }
}
