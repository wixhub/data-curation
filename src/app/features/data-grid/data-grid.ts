import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingPoint } from '../../core/models/tracking.model';

@Component({
  selector: 'app-data-grid',
  imports: [CommonModule],
  templateUrl: './data-grid.html',
  styleUrl: './data-grid.scss',
})
export class DataGrid {
  readonly data = input.required<TrackingPoint[]>();
  readonly selectedId = input<string | null>(null);

  readonly select = output<string>();
  readonly toggleOverride = output<string>();
}
