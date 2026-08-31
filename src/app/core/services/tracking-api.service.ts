import { Service, inject } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { TrackingPoint } from '../models/tracking.model';

@Service()
export class TrackingApiService {
  private readonly http = inject(HttpClient);

  // Expose the tracking resource using Angular's httpResource for static data fetching
  readonly tracksResource = httpResource<TrackingPoint[]>(() => '/data/tracks.json');
}
