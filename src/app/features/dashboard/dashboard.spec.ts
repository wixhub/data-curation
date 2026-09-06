/// <reference types="vitest/globals" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Dashboard } from './dashboard';
import { TrackingStateService } from '../../core/services/tracking-state.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let stateServiceMock: any;

  beforeEach(async () => {
    stateServiceMock = {
      updateFilters: vi.fn(),
      loadRawFile: vi.fn(),
      setViewMode: vi.fn(),
      sessionRestored: signal(false),
      viewMode: signal('split'),
      filters: signal({
        selectedIndividual: 'ALL',
        maxSpeedThreshold: 50,
        showOnlyFlagged: false,
      }),
      availableIndividuals: signal(['ALL']),
      filteredData: signal([]),
      selectedPointId: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [{ provide: TrackingStateService, useValue: stateServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  it('should update individual filter on native select change event', () => {
    const selectElement = document.createElement('select');
    const option = document.createElement('option');
    option.value = 'ind-1';
    selectElement.appendChild(option);
    selectElement.value = 'ind-1';

    const event = { target: selectElement } as unknown as Event;

    component.onIndividualChange(event);

    expect(stateServiceMock.updateFilters).toHaveBeenCalledWith({
      selectedIndividual: 'ind-1',
    });
  });

  it('should update speed limit filter on native input change event', () => {
    const inputElement = document.createElement('input');
    inputElement.value = '75';
    const event = { target: inputElement } as unknown as Event;

    component.onSpeedLimitChange(event);

    expect(stateServiceMock.updateFilters).toHaveBeenCalledWith({
      maxSpeedThreshold: 75,
    });
  });

  it('should update showOnlyFlagged filter on native checkbox change event', () => {
    const inputElement = document.createElement('input');
    inputElement.type = 'checkbox';
    inputElement.checked = true;
    const event = { target: inputElement } as unknown as Event;

    component.onFlaggedToggle(event);

    expect(stateServiceMock.updateFilters).toHaveBeenCalledWith({
      showOnlyFlagged: true,
    });
  });

  it('should handle file selection and invoke loadRawFile', () => {
    const file = new File(['dummy content'], 'tracks.csv', { type: 'text/csv' });
    const inputElement = document.createElement('input');
    inputElement.type = 'file';

    Object.defineProperty(inputElement, 'files', {
      value: [file],
      writable: false,
    });

    const event = { target: inputElement } as unknown as Event;

    component.onFileSelected(event);

    expect(stateServiceMock.loadRawFile).toHaveBeenCalledWith(file);
  });
});
