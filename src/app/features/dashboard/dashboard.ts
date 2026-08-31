import { Component, inject, signal } from '@angular/core';
import { TrackingStateService } from '../../core/services/tracking-state.service';
import { ViewMode } from '../../core/models/tracking.model';
import { DataGrid } from '../data-grid/data-grid';
import { MapInspector } from '../map-inspector/map-inspector';
import { Footer } from '../../core/layout/footer/footer';

@Component({
  selector: 'app-dashboard',
  imports: [DataGrid, MapInspector, Footer],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // Inject tracking state service for centralized data management
  readonly stateService = inject(TrackingStateService);

  // Current active layout view mode signal ('split', 'table-only', 'map-only')
  readonly viewMode = signal<ViewMode>('split');

  // Handle individual filter change from native select element event
  onIndividualChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.stateService.updateFilters({ selectedIndividual: value });
  }

  // Handle speed threshold filter change from native input event
  onSpeedLimitChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.stateService.updateFilters({ maxSpeedThreshold: value });
  }

  // Handle flagged filter toggle change from native checkbox event
  onFlaggedToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.stateService.updateFilters({ showOnlyFlagged: checked });
  }

  // Handle raw file upload (CSV or JSON) and pass it to the state service parser
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.stateService.loadRawFile(file);
    }
  }
}
