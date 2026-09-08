import { TrackingPoint } from '../models/tracking.model';

/**
 * Handles exporting filtered tracking datasets into downloadable JSON or CSV formats.
 */
export function exportTrackingData(data: TrackingPoint[], format: 'csv' | 'json'): void {
  if (!data || data.length === 0) return;

  const content = format === 'json' ? serializeToJson(data) : serializeToCsv(data);
  const mimeType = format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;';
  const filename = generateFilename(format);

  triggerBrowserDownload(content, mimeType, filename);
}

function serializeToJson(data: TrackingPoint[]): string {
  return JSON.stringify(data, null, 2);
}

function serializeToCsv(data: TrackingPoint[]): string {
  const headers = [
    'ID',
    'Individual',
    'Timestamp',
    'Latitude',
    'Longitude',
    'Speed',
    'Accuracy',
    'Flagged',
  ];

  const rows = data.map((p) => [
    p.id,
    p.individualId,
    p.timestamp,
    p.latitude,
    p.longitude,
    p.speedKmH ?? 0,
    p.accuracyMeters,
    p.isFlagged,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function generateFilename(format: 'csv' | 'json'): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `curated_tracks_${timestamp}.${format}`;
}

function triggerBrowserDownload(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}
