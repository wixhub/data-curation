import { GeospatialQcEngine } from './geospatial-qc.engine';
import { TrackingPoint, ManualOverride } from '../models/tracking.model';

describe('GeospatialQcEngine', () => {
  let engine: GeospatialQcEngine;

  beforeEach(() => {
    engine = new GeospatialQcEngine();
  });

  it('should flag points exceeding the maximum speed threshold', () => {
    const points: TrackingPoint[] = [
      {
        id: '1',
        individualId: 'wolf-1',
        timestamp: '2026-06-07T10:00:00Z',
        latitude: 47.0,
        longitude: 9.0,
        accuracyMeters: 10,
        isFlagged: false,
      },
      {
        id: '2',
        individualId: 'wolf-1',
        timestamp: '2026-06-07T10:01:00Z', // 1 minute later, but 1 degree lat apart (~111 km) -> massive speed
        latitude: 48.0,
        longitude: 9.0,
        accuracyMeters: 10,
        isFlagged: false,
      },
    ];

    const result = engine.run(points, {
      maxSpeedThreshold: 50,
      manualOverrides: new Map(),
    });

    expect(result[0].isFlagged).toBe(false);
    expect(result[1].isFlagged).toBe(true);
    expect(result[1].flagReason).toContain('Excessive speed');
  });

  it('should flag points with low GPS accuracy', () => {
    const points: TrackingPoint[] = [
      {
        id: '1',
        individualId: 'bear-1',
        timestamp: '2026-06-07T10:00:00Z',
        latitude: 47.0,
        longitude: 9.0,
        accuracyMeters: 150, // > 100m threshold
        isFlagged: false,
      },
    ];

    const result = engine.run(points, {
      maxSpeedThreshold: 50,
      manualOverrides: new Map(),
    });

    expect(result[0].isFlagged).toBe(true);
    expect(result[0].flagReason).toContain('Low GPS accuracy');
  });

  it('should respect manual overrides over automatic evaluation', () => {
    const points: TrackingPoint[] = [
      {
        id: '1',
        individualId: 'lynx-1',
        timestamp: '2026-06-07T10:00:00Z',
        latitude: 47.0,
        longitude: 9.0,
        accuracyMeters: 150, // normally flagged due to accuracy
        isFlagged: false,
      },
    ];

    const manualOverrides = new Map<string, ManualOverride>();
    manualOverrides.set('1', { isFlagged: false, manuallyOverridden: true });

    const result = engine.run(points, {
      maxSpeedThreshold: 50,
      manualOverrides,
    });

    expect(result[0].isFlagged).toBe(false);
    expect(result[0].manuallyOverridden).toBe(true);
    expect(result[0].flagReason).toBe('');
  });
});
