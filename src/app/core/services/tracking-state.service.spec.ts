import { TrackingStateService } from './tracking-state.service';
import { TrackingApiService } from './tracking-api.service';
import { TrackingParserService } from './tracking-parser.service';
import { GeospatialQcEngine } from './geospatial-qc.engine';
import { DatabaseService } from './database.service';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

describe('TrackingStateService', () => {
  let service: TrackingStateService;
  let apiServiceMock: {
    tracksResource: { value: ReturnType<typeof signal>; isLoading: ReturnType<typeof signal> };
  };
  let dbServiceMock: {
    getLatestSession: ReturnType<typeof vi.fn>;
    saveSession: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
  };
  let parserServiceMock: { parseFile: ReturnType<typeof vi.fn> };
  let qcEngineMock: { run: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();

    apiServiceMock = {
      tracksResource: {
        value: signal([]),
        isLoading: signal(false),
      },
    };

    dbServiceMock = {
      getLatestSession: vi.fn().mockResolvedValue(null),
      saveSession: vi.fn().mockResolvedValue(undefined),
      clearSession: vi.fn().mockResolvedValue(undefined),
    };

    parserServiceMock = {
      parseFile: vi.fn().mockReturnValue([]),
    };

    qcEngineMock = {
      run: vi.fn().mockImplementation((points) => points),
    };

    TestBed.configureTestingModule({
      providers: [
        TrackingStateService,
        { provide: TrackingApiService, useValue: apiServiceMock },
        { provide: DatabaseService, useValue: dbServiceMock },
        { provide: TrackingParserService, useValue: parserServiceMock },
        { provide: GeospatialQcEngine, useValue: qcEngineMock },
      ],
    });

    service = TestBed.inject(TrackingStateService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize with default filters and view mode', () => {
    expect(service.viewMode()).toBe('split');
    expect(service.filters().maxSpeedThreshold).toBe(50);
    expect(service.sessionRestored()).toBe(false);
  });

  it('should update filters correctly', () => {
    service.updateFilters({ maxSpeedThreshold: 30, selectedIndividual: 'wolf-1' });
    expect(service.filters().maxSpeedThreshold).toBe(30);
    expect(service.filters().selectedIndividual).toBe('wolf-1');
  });

  it('should auto-dismiss session restoration after 5 seconds', async () => {
    const mockSession = {
      timestamp: Date.now(),
      uploadedTracks: [],
      manualOverrides: [],
      filters: {
        startDate: null,
        endDate: null,
        selectedIndividual: 'ALL',
        showOnlyFlagged: false,
        maxSpeedThreshold: 20,
      },
    };

    dbServiceMock.getLatestSession.mockResolvedValueOnce(mockSession);

    // Trigger initialization with mock data
    apiServiceMock.tracksResource.value.set([
      {
        id: '1',
        individualId: 'a',
        timestamp: '2026-01-01T00:00:00Z',
        latitude: 0,
        longitude: 0,
        accuracyMeters: 10,
        isFlagged: false,
      },
    ]);

    // Wait for async effect and initialization to settle
    await vi.waitFor(() => {
      expect(service.sessionRestored()).toBe(true);
    });

    // Fast-forward time by 5 seconds for auto-dismiss timeout
    vi.advanceTimersByTime(5000);

    expect(service.sessionRestored()).toBe(false);
  });
});
