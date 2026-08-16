import { Component, input, output } from '@angular/core';
import { TrackingPoint } from '../../core/models/tracking.model';

@Component({
  selector: 'app-map-inspector',
  templateUrl: './map-inspector.html',
  styleUrl: './map-inspector.scss',
})
export class MapInspector {
  // Required input using modern signal-based inputs
  readonly data = input.required<TrackingPoint[]>();

  // Optional input with default value
  readonly selectedId = input<string | null>(null);

  // Modern output declaration using the output() function
  readonly select = output<string>();

  // Project longitude coordinate to X-axis value
  projectX(lon: number): number {
    return (((lon + 180) % 360) / 360) * 500;
  }

  // Project latitude coordinate to Y-axis value
  projectY(lat: number): number {
    return ((90 - lat) / 180) * 500;
  }
}
