import { Service } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { TrackingPoint } from '../models/tracking.model';

@Service()
export class TrackingApiService {
  // Expose the tracking resource using Angular's httpResource for static data fetching
  readonly tracksResource = httpResource<TrackingPoint[]>(() => '/data/tracks.json');
}
