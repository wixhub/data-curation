import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapInspector } from './map-inspector';
import { LeafletMapService } from '../../core/services/map.service';
import { TrackingPoint } from '../../core/models/tracking.model';

describe('MapInspector', () => {
  let fixture: ComponentFixture<MapInspector>;
  let component: MapInspector;
  let mapServiceMock: {
    initializeMap: ReturnType<typeof vi.fn>;
    renderTelemetryPoints: ReturnType<typeof vi.fn>;
  };

  const mockTrackingPoints: TrackingPoint[] = [
    { latitude: 48.0, longitude: 9.0, timestamp: '2026-03-30T10:00:00Z' } as TrackingPoint,
    { latitude: 48.1, longitude: 9.1, timestamp: '2026-03-30T10:05:00Z' } as TrackingPoint,
  ];

  beforeEach(async () => {
    mapServiceMock = {
      initializeMap: vi.fn(),
      renderTelemetryPoints: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MapInspector],
    })
      .overrideComponent(MapInspector, {
        set: {
          providers: [{ provide: LeafletMapService, useValue: mapServiceMock }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MapInspector);
    component = fixture.componentInstance;

    // Provide required input data
    fixture.componentRef.setInput('data', mockTrackingPoints);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the map and render points on afterNextRender', () => {
    fixture.detectChanges(); // Triggers lifecycle and afterNextRender

    expect(mapServiceMock.initializeMap).toHaveBeenCalledTimes(1);
    const containerIdArg = mapServiceMock.initializeMap.mock.calls[0][0];
    const coordsArg = mapServiceMock.initializeMap.mock.calls[0][1];

    expect(containerIdArg).toMatch(/^map-frame-[a-z0-9]+$/);
    expect(coordsArg).toEqual([48.0, 9.0]);
    expect(mapServiceMock.renderTelemetryPoints).toHaveBeenCalledWith(mockTrackingPoints);
  });

  it('should re-render telemetry points when data changes via effect', async () => {
    fixture.detectChanges(); // Initial render

    const newPoints: TrackingPoint[] = [
      { latitude: 50.0, longitude: 8.0, timestamp: '2026-03-30T11:00:00Z' } as TrackingPoint,
    ];

    // Update required input
    fixture.componentRef.setInput('data', newPoints);
    await fixture.whenStable();

    expect(mapServiceMock.renderTelemetryPoints).toHaveBeenCalledWith(newPoints);
  });
});
