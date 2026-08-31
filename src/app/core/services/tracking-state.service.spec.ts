import { TestBed } from '@angular/core/testing';
import { TrackingStateService } from './tracking-state.service';
import { TrackingApiService } from './tracking-api.service';
import { TrackingParserService } from './tracking-parser.service';
import { GeospatialQcEngine } from './geospatial-qc-engine';

describe('TrackingStateService', () => {
  let service: TrackingStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrackingStateService,
        {
          provide: TrackingApiService,
          useValue: { tracksResource: { value: () => [], isLoading: () => false } },
        },
        TrackingParserService,
        GeospatialQcEngine,
      ],
    });

    service = TestBed.inject(TrackingStateService);
  });

  it('should initialize with default filters and view mode', () => {
    expect(service.viewMode()).toBe('split');
    expect(service.filters().maxSpeedThreshold).toBe(50);
  });

  it('should update filters correctly', () => {
    service.updateFilters({ maxSpeedThreshold: 80 });
    expect(service.filters().maxSpeedThreshold).toBe(80);
  });

  it('should change view mode', () => {
    service.setViewMode('map-only');
    expect(service.viewMode()).toBe('map-only');
  });
});
