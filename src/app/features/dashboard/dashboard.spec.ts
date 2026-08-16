import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { TrackingStateService } from '../../core/services/tracking-state.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;
  let stateService: TrackingStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [TrackingStateService, provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    stateService = TestBed.inject(TrackingStateService);

    // Flush initial request made by rxResource in the service
    const req = httpMock.expectOne('data/tracks.json');
    req.flush([]);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should update individual filter on native select change event', () => {
    const updateFiltersSpy = vi.spyOn(stateService, 'updateFilters');

    const event = {
      target: { value: 'ind-1' } as HTMLSelectElement,
    } as unknown as Event;

    component.onIndividualChange(event);
    expect(updateFiltersSpy).toHaveBeenCalledWith({ selectedIndividual: 'ind-1' });
  });

  it('should update speed limit filter on native input change event', () => {
    const updateFiltersSpy = vi.spyOn(stateService, 'updateFilters');

    const event = {
      target: { value: '80' } as HTMLInputElement,
    } as unknown as Event;

    component.onSpeedLimitChange(event);
    expect(updateFiltersSpy).toHaveBeenCalledWith({ maxSpeedThreshold: 80 });
  });

  it('should update showOnlyFlagged filter on native checkbox change event', () => {
    const updateFiltersSpy = vi.spyOn(stateService, 'updateFilters');

    const event = {
      target: { checked: true } as HTMLInputElement,
    } as unknown as Event;

    component.onFlaggedToggle(event);
    expect(updateFiltersSpy).toHaveBeenCalledWith({ showOnlyFlagged: true });
  });

  it('should switch view modes correctly', () => {
    expect(component.viewMode()).toBe('split');

    component.viewMode.set('table-only');
    expect(component.viewMode()).toBe('table-only');

    component.viewMode.set('map-only');
    expect(component.viewMode()).toBe('map-only');
  });
});
