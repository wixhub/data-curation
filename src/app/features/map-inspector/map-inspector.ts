import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingPoint } from '../../core/models/tracking.model';

@Component({
  selector: 'app-map-inspector',
  imports: [CommonModule],
  templateUrl: './map-inspector.html',
  styleUrl: './map-inspector.scss',
})
export class MapInspector {
  readonly data = input.required<TrackingPoint[]>();
  readonly selectedId = input<string | null>(null);
  readonly select = output<string>();

  projectX(lon: number): number {
    return (((lon + 180) % 360) / 360) * 500;
  }

  projectY(lat: number): number {
    return ((90 - lat) / 180) * 500;
  }
}
