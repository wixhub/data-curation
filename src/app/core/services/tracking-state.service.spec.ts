/// <reference types="vitest/globals" />

import { TestBed } from '@angular/core/testing';
import { TrackingStateService } from './tracking-state.service';
import { TrackingApiService } from './tracking-api.service';
import { TrackingParserService } from './tracking-parser.service';
import { GeospatialQcEngine } from './geospatial-qc-engine';
import { DatabaseService } from './database.service';

describe('TrackingStateService', () => {
  let service: TrackingStateService;
  let apiServiceMock: any;
  let parserServiceMock: any;
  let qcEngineMock: any;
  let dbServiceMock: any;

  beforeEach(() => {
    apiServiceMock = {
      tracksResource: {
        isLoading: vi.fn().mockReturnValue(false),
        value: vi.fn().mockReturnValue([]),
      },
    };
    parserServiceMock = {
      parseFile: vi.fn(),
    };
    qcEngineMock = {
      runQC: vi.fn().mockImplementation((points) => points),
    };
    dbServiceMock = {
      saveSession: vi.fn().mockResolvedValue(undefined),
      getLatestSession: vi.fn().mockResolvedValue(null),
      clearSession: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        TrackingStateService,
        { provide: TrackingApiService, useValue: apiServiceMock },
        { provide: TrackingParserService, useValue: parserServiceMock },
        { provide: GeospatialQcEngine, useValue: qcEngineMock },
        { provide: DatabaseService, useValue: dbServiceMock },
      ],
    });

    service = TestBed.inject(TrackingStateService);
  });

  it('should initialize with default states and filters', () => {
    expect(service.viewMode()).toBe('split');
    expect(service.sessionRestored()).toBe(false);
    expect(service.filters().selectedIndividual).toBe('ALL');
    expect(service.filters().maxSpeedThreshold).toBe(50);
  });

  it('should update filters correctly', () => {
    service.updateFilters({ selectedIndividual: 'ind-1', showOnlyFlagged: true });
    expect(service.filters().selectedIndividual).toBe('ind-1');
    expect(service.filters().showOnlyFlagged).toBe(true);
  });

  it('should switch view modes', () => {
    service.setViewMode('map-only');
    expect(service.viewMode()).toBe('map-only');
  });

  it('should restore the latest session from database successfully', async () => {
    const mockSession = {
      uploadedTracks: [{ id: '1', individualId: 'ind-1', isFlagged: false }],
      manualOverrides: [['1', { isFlagged: true, manuallyOverridden: true }]],
      filters: { selectedIndividual: 'ind-1', showOnlyFlagged: false, maxSpeedThreshold: 30 },
    };

    dbServiceMock.getLatestSession.mockResolvedValue(mockSession);

    const restored = await service.restoreLatestSession();

    expect(restored).toBe(true);
    expect(service.sessionRestored()).toBe(true);
    expect(service.filters().selectedIndividual).toBe('ind-1');
  });

  it('should clear the current session and reset storage', async () => {
    await service.clearCurrentSession();

    expect(dbServiceMock.clearSession).toHaveBeenCalled();
    expect(service.sessionRestored()).toBe(false);
  });

  it('should filter points correctly based on individual and flag criteria', () => {
    apiServiceMock.tracksResource.value.mockReturnValue([
      { id: '1', individualId: 'ind-1', isFlagged: false },
      { id: '2', individualId: 'ind-2', isFlagged: true },
    ]);

    // Filter by individual ind-2
    service.updateFilters({ selectedIndividual: 'ind-2' });
    expect(service.filteredData().length).toBe(1);
    expect(service.filteredData()[0].id).toBe('2');

    // Filter by showOnlyFlagged
    service.updateFilters({ selectedIndividual: 'ALL', showOnlyFlagged: true });
    expect(service.filteredData().length).toBe(1);
    expect(service.filteredData()[0].id).toBe('2');
  });

  it('should delete a point from tracking records', () => {
    apiServiceMock.tracksResource.value.mockReturnValue([
      { id: '1', individualId: 'ind-1' },
      { id: '2', individualId: 'ind-1' },
    ]);

    service.deletePoint('1');

    const raw = service.rawData();
    expect(raw.length).toBe(1);
    expect(raw[0].id).toBe('2');
  });
});
