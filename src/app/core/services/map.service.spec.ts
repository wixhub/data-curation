/// <reference types="vitest/globals" />

import { TestBed } from '@angular/core/testing';
import { LeafletMapService } from './map.service';
import { TrackingPoint } from '../models/tracking.model';
import { environment } from '../../../environments/environment';

describe('LeafletMapService', () => {
  let mapService: LeafletMapService;
  let container: HTMLDivElement;

  beforeEach(() => {
    environment.cartoApiKey = 'test-api-key';

    container = document.createElement('div');
    container.id = 'map';
    document.body.appendChild(container);

    TestBed.configureTestingModule({
      providers: [LeafletMapService],
    });
    mapService = TestBed.inject(LeafletMapService);
  });

  afterEach(() => {
    if (mapService) {
      mapService.disposeMap();
    }
    container.remove();
    vi.clearAllMocks();
  });

  it('should initialize the map with correct options and tile layer', () => {
    mapService.initializeMap('map', [20, 0], 3);

    const mapInstance = (mapService as any)['mapInstance'];
    expect(mapInstance).toBeTruthy();
    expect(container.classList.contains('leaflet-container')).toBe(true);
  });

  it('should not re-initialize the map if it already exists', () => {
    mapService.initializeMap('map');
    const firstInstance = (mapService as any)['mapInstance'];

    mapService.initializeMap('map');
    const secondInstance = (mapService as any)['mapInstance'];

    expect(firstInstance).toBe(secondInstance);
  });

  it('should render telemetry points and polylines on the map', () => {
    mapService.initializeMap('map');

    const points: TrackingPoint[] = [
      {
        id: '1',
        individualId: 'animal-1',
        latitude: 10,
        longitude: 10,
        timestamp: '2026-01-01T00:00:00Z',
        accuracyMeters: 5,
        isFlagged: false,
      } as any,
      {
        id: '2',
        individualId: 'animal-1',
        latitude: 11,
        longitude: 11,
        timestamp: '2026-01-01T01:00:00Z',
        accuracyMeters: 10,
        isFlagged: true,
      } as any,
    ];

    mapService.renderTelemetryPoints(points);

    const markerLayerGroup = (mapService as any)['markerLayerGroup'];
    const vectorLayerGroup = (mapService as any)['vectorLayerGroup'];

    expect(markerLayerGroup.getLayers().length).toBe(2);
    expect(vectorLayerGroup.getLayers().length).toBe(1);
  });

  it('should cleanly dispose of the map instance', () => {
    mapService.initializeMap('map');
    const mapInstance = (mapService as any)['mapInstance'];
    const removeSpy = vi.spyOn(mapInstance, 'remove');

    mapService.disposeMap();

    expect(removeSpy).toHaveBeenCalled();
    expect((mapService as any)['mapInstance']).toBeNull();
  });
});
