import { TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { TrackingStateService } from '../../core/services/tracking-state.service';
import { signal } from '@angular/core';

describe('Dashboard', () => {
  let component: Dashboard;
  let mockStateService: Partial<TrackingStateService>;

  beforeEach(async () => {
    mockStateService = {
      filters: signal({
        startDate: null,
        endDate: null,
        selectedIndividual: 'ALL',
        showOnlyFlagged: false,
        maxSpeedThreshold: 50,
      }),
      availableIndividuals: signal(['ALL', 'IndA', 'IndB']) as any,
      filteredData: signal([]) as any,
      isLoading: signal(false) as any,
      selectedPointId: signal(null) as any,
      updateFilters: vi.fn(),
      loadRawFile: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [{ provide: TrackingStateService, useValue: mockStateService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should update individual filter on native select change event', () => {
    const event = {
      target: { value: 'IndA' } as HTMLSelectElement,
    } as unknown as Event;

    component.onIndividualChange(event);

    expect(mockStateService.updateFilters).toHaveBeenCalledWith({
      selectedIndividual: 'IndA',
    });
  });

  it('should update speed limit filter on native input change event', () => {
    const event = {
      target: { value: '75' } as HTMLInputElement,
    } as unknown as Event;

    component.onSpeedLimitChange(event);

    expect(mockStateService.updateFilters).toHaveBeenCalledWith({
      maxSpeedThreshold: 75,
    });
  });

  it('should update showOnlyFlagged filter on native checkbox change event', () => {
    const event = {
      target: { checked: true } as HTMLInputElement,
    } as unknown as Event;

    component.onFlaggedToggle(event);

    expect(mockStateService.updateFilters).toHaveBeenCalledWith({
      showOnlyFlagged: true,
    });
  });

  it('should switch view modes correctly', () => {
    expect(component.viewMode()).toBe('split');
    component.viewMode.set('table-only');
    expect(component.viewMode()).toBe('table-only');
  });
});
