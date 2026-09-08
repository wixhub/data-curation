import { Component, inject } from '@angular/core';
import { TrackingStateService } from '../../core/services/tracking-state.service';
import { DataGrid } from '../data-grid/data-grid';
import { MapInspector } from '../map-inspector/map-inspector';
import { Footer } from '../../core/layout/footer/footer';
import { Header } from '../../core/layout/header/header';

@Component({
  selector: 'app-dashboard',
  imports: [DataGrid, MapInspector, Footer, Header],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // Inject tracking state service for centralized data management
  readonly stateService = inject(TrackingStateService);

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
}
