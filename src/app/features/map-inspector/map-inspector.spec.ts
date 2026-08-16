import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapInspector } from './map-inspector';
import { TrackingPoint } from '../../core/models/tracking.model';

describe('MapInspector', () => {
  let component: MapInspector;
  let fixture: ComponentFixture<MapInspector>;

  const mockPoints: TrackingPoint[] = [
    {
      id: '1',
      individualId: 'ind-1',
      timestamp: '2026-06-01T10:00:00Z',
      latitude: 47.6,
      longitude: 9.4,
      accuracyMeters: 10,
      isFlagged: false,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapInspector],
    }).compileComponents();

    fixture = TestBed.createComponent(MapInspector);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should project longitude to X coordinate correctly', () => {
    // Lon 0 should project to middle (250 on a 500 scale)
    expect(component.projectX(0)).toBe(250);
    // Lon -180 should project to 0
    expect(component.projectX(-180)).toBe(0);
  });

  it('should project latitude to Y coordinate correctly', () => {
    // Lat 90 (North Pole) should project to 0
    expect(component.projectY(90)).toBe(0);
    // Lat -90 (South Pole) should project to 500
    expect(component.projectY(-90)).toBe(500);
    // Lat 0 (Equator) should project to 250
    expect(component.projectY(0)).toBe(250);
  });

  it('should bind required input properly', () => {
    fixture.componentRef.setInput('data', mockPoints);
    fixture.componentRef.setInput('selectedId', '1');
    fixture.detectChanges();

    expect(component.data()).toEqual(mockPoints);
    expect(component.selectedId()).toBe('1');
  });

  it('should emit select event when triggered', () => {
    let emittedId: string | null = null;
    component.select.subscribe((id) => {
      emittedId = id;
    });

    // Simulate emission
    component.select.emit('1');
    expect(emittedId).toBe('1');
  });
});
