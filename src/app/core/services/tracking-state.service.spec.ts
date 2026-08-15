import { TestBed } from '@angular/core/testing';

import { TrackingStateService } from './tracking-state.service';

describe('TrackingStateService', () => {
  let service: TrackingStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackingStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
