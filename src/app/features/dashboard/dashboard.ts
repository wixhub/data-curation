import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackingStateService } from '../../core/services/tracking-state.service';
import { ViewMode } from '../../core/models/tracking.model';
import { DataGrid } from '../data-grid/data-grid';
import { MapInspector } from '../map-inspector/map-inspector';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, DataGrid, MapInspector],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  readonly stateService = inject(TrackingStateService);
  readonly viewMode = signal<ViewMode>('split');

  onIndividualChange(val: string) {
    this.stateService.updateFilters({ selectedIndividual: val });
  }

  onSpeedLimitChange(val: number) {
    this.stateService.updateFilters({ maxSpeedThreshold: Number(val) });
  }

  onFlaggedToggle(val: boolean) {
    this.stateService.updateFilters({ showOnlyFlagged: val });
  }
}
