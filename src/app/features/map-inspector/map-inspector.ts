import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
  afterNextRender,
  effect,
} from '@angular/core';
import { LeafletMapService } from '../../core/services/map.service';
import { TrackingPoint } from '../../core/models/tracking.model';

@Component({
  selector: 'app-map-inspector',
  templateUrl: './map-inspector.html',
  styleUrl: './map-inspector.scss',
  providers: [LeafletMapService],
})
export class MapInspector {
  readonly data = input.required<TrackingPoint[]>();
  readonly selectedId = input<string | null>(null);
  readonly select = output<string>();

  readonly mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private readonly mapService = inject(LeafletMapService);
  private isMapInitialized = false;

  constructor() {
    afterNextRender(() => {
      const containerId = 'map-frame-' + Math.random().toString(36).substring(2, 9);
      this.mapContainer().nativeElement.id = containerId;

      const points = this.data();
      const initialLat = points.length > 0 ? points[0].latitude : 47.65;
      const initialLon = points.length > 0 ? points[0].longitude : 9.47;

      this.mapService.initializeMap(containerId, [initialLat, initialLon], 10);
      this.isMapInitialized = true;

      if (points.length > 0) {
        this.mapService.renderTelemetryPoints(points);
      }
    });

    effect(() => {
      const points = this.data();
      if (this.isMapInitialized && points.length > 0) {
        this.mapService.renderTelemetryPoints(points);
      }
    });
  }
}
