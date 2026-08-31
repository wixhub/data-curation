import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TrackingApiService } from './tracking-api.service';

describe('TrackingApiService', () => {
  let service: TrackingApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrackingApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify that no unmatched requests are left outstanding
    httpMock.verify();
  });

  it('should be created', () => {
    service = TestBed.inject(TrackingApiService);
    expect(service).toBeTruthy();
  });

  it('should fetch tracks resource successfully', async () => {
    // Instantiate the service
    service = TestBed.inject(TrackingApiService);

    const mockTracks = [
      {
        id: 'trk_001',
        individualId: 'Wolf_Alpha',
        timestamp: '2026-06-01T08:00:00Z',
        latitude: 47.668,
        longitude: 9.175,
        accuracyMeters: 5,
        isFlagged: false,
      },
    ];

    // Flush pending effects so httpResource fires its initial request
    TestBed.tick();

    // Expect and intercept the HTTP request triggered by httpResource
    const req = httpMock.expectOne('/data/tracks.json');
    expect(req.request.method).toBe('GET');

    // Provide the mock response payload
    req.flush(mockTracks);

    // Wait for application stability to allow the resource signal to resolve
    await TestBed.inject(ApplicationRef).whenStable();

    // Verify the resource successfully resolves the value
    expect(service.tracksResource.value()).toEqual(mockTracks);
  });
});
