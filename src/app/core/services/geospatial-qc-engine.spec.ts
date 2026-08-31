import { TestBed } from '@angular/core/testing';
import { GeospatialQcEngine } from './geospatial-qc-engine';
import { TrackingPoint } from '../models/tracking.model';

describe('GeospatialQcEngine', () => {
  let service: GeospatialQcEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GeospatialQcEngine],
    });
    service = TestBed.inject(GeospatialQcEngine);
  });

  it('should flag points with excessive speed', () => {
    const points: TrackingPoint[] = [
      {
        id: '1',
        individualId: 'A',
        timestamp: '2026-01-01T10:00:00Z',
        latitude: 0,
        longitude: 0,
        accuracyMeters: 10,
        isFlagged: false,
      },
      {
        id: '2',
        individualId: 'A',
        timestamp: '2026-01-01T10:01:00Z',
        latitude: 1,
        longitude: 1,
        accuracyMeters: 10,
        isFlagged: false,
      }, // 1 min later, ~157 km distance -> huge speed
    ];

    const result = service.runQC(points, 50, new Map());
    expect(result[1].isFlagged).toBe(true);
    expect(result[1].flagReason).toContain('Excessive speed');
  });

  it('should respect manual overrides', () => {
    const points: TrackingPoint[] = [
      {
        id: '1',
        individualId: 'A',
        timestamp: '2026-01-01T10:00:00Z',
        latitude: 0,
        longitude: 0,
        accuracyMeters: 10,
        isFlagged: false,
      },
    ];

    const overrides = new Map([['1', { isFlagged: true, manuallyOverridden: true }]]);
    const result = service.runQC(points, 50, overrides);

    expect(result[0].isFlagged).toBe(true);
    expect(result[0].manuallyOverridden).toBe(true);
  });
});
