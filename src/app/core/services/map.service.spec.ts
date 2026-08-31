/// <reference types="vitest/globals" />

import { TestBed } from '@angular/core/testing';
import { LeafletMapService } from './map.service';
import { TrackingPoint } from '../models/tracking.model';
import * as L from 'leaflet';

describe('LeafletMapService', () => {
  let service: LeafletMapService;
  let container: HTMLDivElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LeafletMapService],
    });

    service = TestBed.inject(LeafletMapService);

    container = document.createElement('div');
    container.id = 'map-container';
    container.style.width = '400px';
    container.style.height = '400px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    service.disposeMap();
    container.remove();
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize Leaflet map instance correctly', () => {
    service.initializeMap('map-container', [10, 20], 5);

    const mapInstance = (service as unknown as { mapInstance: L.Map | null }).mapInstance;
    expect(mapInstance).not.toBeNull();
    expect(mapInstance?.getZoom()).toBe(5);
    expect(mapInstance?.getCenter().lat).toBe(10);
    expect(mapInstance?.getCenter().lng).toBe(20);
  });

  it('should not re-initialize map if already initialized', () => {
    service.initializeMap('map-container', [10, 20], 5);
    const firstInstance = (service as unknown as { mapInstance: L.Map | null }).mapInstance;

    service.initializeMap('map-container', [0, 0], 2);
    const secondInstance = (service as unknown as { mapInstance: L.Map | null }).mapInstance;

    expect(firstInstance).toBe(secondInstance);
  });

  it('should render telemetry markers and vector polylines correctly', () => {
    service.initializeMap('map-container');

    const sampleRecords: TrackingPoint[] = [
      {
        id: 'rec-1',
        individualId: 'Wolf_Alpha',
        timestamp: '2026-06-01T12:00:00Z',
        latitude: 10,
        longitude: 10,
        accuracyMeters: 5,
        isFlagged: false,
        speedKmH: 15,
      },
      {
        id: 'rec-2',
        individualId: 'Wolf_Alpha',
        timestamp: '2026-06-01T13:00:00Z',
        latitude: 20,
        longitude: 20,
        accuracyMeters: 10,
        isFlagged: true,
        speedKmH: 60,
      },
    ];

    expect(() => service.renderTelemetryPoints(sampleRecords)).not.toThrow();

    const markerGroup = (service as unknown as { markerLayerGroup: L.LayerGroup }).markerLayerGroup;
    const vectorGroup = (service as unknown as { vectorLayerGroup: L.LayerGroup }).vectorLayerGroup;

    expect(markerGroup.getLayers().length).toBe(2);
    expect(vectorGroup.getLayers().length).toBe(1);
  });

  it('should dispose map instance safely', () => {
    service.initializeMap('map-container');
    const mapInstance = (service as unknown as { mapInstance: L.Map | null }).mapInstance;
    expect(mapInstance).not.toBeNull();

    service.disposeMap();
    const disposedInstance = (service as unknown as { mapInstance: L.Map | null }).mapInstance;
    expect(disposedInstance).toBeNull();
  });
});
