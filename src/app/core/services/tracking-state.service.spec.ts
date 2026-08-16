import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TrackingStateService } from './tracking-state.service';
import { TrackingPoint } from '../models/tracking.model';

describe('TrackingStateService', () => {
  let service: TrackingStateService;
  let httpMock: HttpTestingController;

  const mockPoints: TrackingPoint[] = [
    {
      id: 'p1',
      individualId: 'Ind-A',
      timestamp: '2026-06-01T10:00:00Z',
      latitude: 34.05,
      longitude: -118.24,
      accuracyMeters: 10,
      isFlagged: false,
    },
    {
      id: 'p2',
      individualId: 'Ind-A',
      timestamp: '2026-06-01T11:00:00Z',
      latitude: 36.16,
      longitude: -115.13,
      accuracyMeters: 15,
      isFlagged: false,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrackingStateService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TrackingStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch tracking tracks via rxResource and execute QC engine', async () => {
    const req = httpMock.expectOne('data/tracks.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockPoints);

    // Allow rxResource stream evaluation tick
    await Promise.resolve();

    const raw = service.rawData();
    expect(raw.length).toBe(2);
    expect(raw[1].speedKmH).toBeGreaterThan(0);
  });

  it('should filter points based on selected individual criteria', async () => {
    const req = httpMock.expectOne('data/tracks.json');
    req.flush([
      ...mockPoints,
      {
        id: 'p3',
        individualId: 'Ind-B',
        timestamp: '2026-06-01T10:00:00Z',
        latitude: 40.71,
        longitude: -74.0,
        accuracyMeters: 5,
      },
    ]);

    await Promise.resolve();

    service.updateFilters({ selectedIndividual: 'Ind-B' });

    const filtered = service.filteredData();
    expect(filtered.length).toBe(1);
    expect(filtered[0].individualId).toBe('Ind-B');
  });

  it('should toggle manual override state correctly', async () => {
    const req = httpMock.expectOne('data/tracks.json');
    req.flush(mockPoints);

    await Promise.resolve();

    expect(service.rawData()[1].isFlagged).toBeDefined();

    // Toggle override for second point
    service.toggleOverride('p2');

    const updatedPoint = service.rawData().find((p) => p.id === 'p2');
    expect(updatedPoint?.isFlagged).toBeTruthy();
  });
});
