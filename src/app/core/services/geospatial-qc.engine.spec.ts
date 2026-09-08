import { GeospatialQcEngine } from './geospatial-qc.engine';
import { TrackingPoint } from '../models/tracking.model';

describe('GeospatialQcEngine', () => {
  let engine: GeospatialQcEngine;

  beforeEach(() => {
    engine = new GeospatialQcEngine();
  });

  it('should sort points by timestamp and calculate speed correctly', () => {
    const points: TrackingPoint[] = [
      {
        id: '2',
        individualId: 'ind-1',
        latitude: 0.01,
        longitude: 0.01,
        timestamp: '2026-01-01T01:00:00Z',
        accuracyMeters: 10,
      } as any,
      {
        id: '1',
        individualId: 'ind-1',
        latitude: 0,
        longitude: 0,
        timestamp: '2026-01-01T00:00:00Z',
        accuracyMeters: 10,
      } as any,
    ];

    const results = engine.runQC(points, 2000, new Map());

    // Should be sorted by timestamp, so '1' comes first (speed 0), then '2'
    expect(results[0].id).toBe('1');
    expect(results[0].speedKmH).toBe(0);
    expect(results[0].isFlagged).toBe(false);

    expect(results[1].id).toBe('2');
    expect(results[1].speedKmH).toBeGreaterThan(0);
  });

  it('should flag points with excessive speed above the limit', () => {
    const points: TrackingPoint[] = [
      {
        id: '1',
        individualId: 'ind-1',
        latitude: 0,
        longitude: 0,
        timestamp: '2026-01-01T00:00:00Z',
        accuracyMeters: 10,
      } as any,
      // Massive jump in 1 hour -> very high speed
      {
        id: '2',
        individualId: 'ind-1',
        latitude: 1.0,
        longitude: 1.0,
        timestamp: '2026-01-01T01:00:00Z',
        accuracyMeters: 10,
      } as any,
    ];

    // Low speed limit to force flag
    const results = engine.runQC(points, 10, new Map());

    expect(results[1].isFlagged).toBe(true);
    expect(results[1].flagReason).toContain('Excessive speed');
  });

  it('should flag points with low GPS accuracy (>100m)', () => {
    const points: TrackingPoint[] = [
      {
        id: '1',
        individualId: 'ind-1',
        latitude: 0,
        longitude: 0,
        timestamp: '2026-01-01T00:00:00Z',
        accuracyMeters: 150,
      } as any,
    ];

    const results = engine.runQC(points, 100, new Map());

    expect(results[0].isFlagged).toBe(true);
    expect(results[0].flagReason).toBe('Low GPS accuracy: 150m');
  });

  it('should override auto-flags with manual override settings', () => {
    const points: TrackingPoint[] = [
      {
        id: '1',
        individualId: 'ind-1',
        latitude: 0,
        longitude: 0,
        timestamp: '2026-01-01T00:00:00Z',
        accuracyMeters: 150,
      } as any,
    ];

    const overrides = new Map<string, { isFlagged: boolean; manuallyOverridden: boolean }>();
    overrides.set('1', { isFlagged: false, manuallyOverridden: true });

    const results = engine.runQC(points, 100, overrides);

    expect(results[0].isFlagged).toBe(false);
    expect(results[0].manuallyOverridden).toBe(true);
  });

  it('should track separate individuals independently for speed calculations', () => {
    const points: TrackingPoint[] = [
      {
        id: 'a1',
        individualId: 'ind-A',
        latitude: 0,
        longitude: 0,
        timestamp: '2026-01-01T00:00:00Z',
        accuracyMeters: 10,
      } as any,
      {
        id: 'b1',
        individualId: 'ind-B',
        latitude: 0,
        longitude: 0,
        timestamp: '2026-01-01T00:30:00Z',
        accuracyMeters: 10,
      } as any,
      {
        id: 'a2',
        individualId: 'ind-A',
        latitude: 0.01,
        longitude: 0.01,
        timestamp: '2026-01-01T01:00:00Z',
        accuracyMeters: 10,
      } as any,
    ];

    const results = engine.runQC(points, 500, new Map());

    // b1 shouldn't calculate speed against a1 because they belong to different individuals
    const b1Result = results.find((p) => p.id === 'b1');
    expect(b1Result?.speedKmH).toBe(0);
  });
});
