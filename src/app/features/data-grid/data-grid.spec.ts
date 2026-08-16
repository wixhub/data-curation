import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataGrid } from './data-grid';
import { TrackingPoint } from '../../core/models/tracking.model';

describe('DataGrid', () => {
  let component: DataGrid;
  let fixture: ComponentFixture<DataGrid>;

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
      imports: [DataGrid],
    }).compileComponents();

    fixture = TestBed.createComponent(DataGrid);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should bind required and optional inputs properly', () => {
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

    component.select.emit('1');
    expect(emittedId).toBe('1');
  });

  it('should emit toggleOverride event when triggered', () => {
    let emittedId: string | null = null;
    component.toggleOverride.subscribe((id) => {
      emittedId = id;
    });

    component.toggleOverride.emit('1');
    expect(emittedId).toBe('1');
  });
});
