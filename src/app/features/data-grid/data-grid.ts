import { Component, input, output } from '@angular/core';
import { TrackingPoint } from '../../core/models/tracking.model';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-data-grid',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './data-grid.html',
  styleUrl: './data-grid.scss',
})
export class DataGrid {
  // Required input using modern signal-based inputs
  readonly data = input.required<TrackingPoint[]>();

  // Optional input with default value for tracking selected point ID
  readonly selectedId = input<string | null>(null);

  // Modern output declarations using the output() function
  readonly select = output<string>();
  readonly toggleOverride = output<string>();

  readonly deletePoint = output<string>();
}
