import { Service, computed, effect, inject, signal } from '@angular/core';
import { TrackingApiService } from './tracking-api.service';
import { TrackingParserService } from './tracking-parser.service';
import { GeospatialQcEngine } from './geospatial-qc-engine';
import { FilterCriteria, TrackingPoint, ViewMode } from '../models/tracking.model';
import { DatabaseService } from './database.service';

@Service()
export class TrackingStateService {
  private readonly apiService = inject(TrackingApiService);
  private readonly parserService = inject(TrackingParserService);
  private readonly qcEngine = inject(GeospatialQcEngine);
  private readonly dbService = inject(DatabaseService);

  readonly viewMode = signal<ViewMode>('split');
  readonly sessionRestored = signal<boolean>(false);

  readonly filters = signal<FilterCriteria>({
    startDate: null,
    endDate: null,
    selectedIndividual: 'ALL',
    showOnlyFlagged: false,
    maxSpeedThreshold: 50,
  });

  readonly selectedPointId = signal<string | null>(null);

  private readonly uploadedTracks = signal<TrackingPoint[] | null>(null);
  private readonly manualOverrides = signal<
    Map<string, { isFlagged: boolean; manuallyOverridden: boolean }>
  >(new Map());

  constructor() {
    // Automatically trigger session auto-save on state changes
    effect(() => {
      const tracks = this.uploadedTracks();
      const overrides = this.manualOverrides();
      const currentFilters = this.filters();

      if (tracks && tracks.length > 0) {
        this.dbService.saveSession(tracks, overrides, currentFilters);
      }
    });

    // Optionally attempt session restoration on service initialization
    this.restoreLatestSession();
  }

  /**
   * Restores the latest unfinished curation session from IndexedDB.
   */
  async restoreLatestSession(): Promise<boolean> {
    const session = await this.dbService.getLatestSession();
    if (session && session.uploadedTracks.length > 0) {
      this.uploadedTracks.set(session.uploadedTracks);
      this.manualOverrides.set(new Map(session.manualOverrides));
      this.filters.set(session.filters);
      this.sessionRestored.set(true);
      return true;
    }
    return false;
  }

  async clearCurrentSession(): Promise<void> {
    await this.dbService.clearSession();
    this.uploadedTracks.set(null);
    this.manualOverrides.set(new Map());
    this.sessionRestored.set(false);
  }

  readonly isLoading = computed(() => this.apiService.tracksResource.isLoading());

  private readonly baseRawData = computed(() => {
    const uploaded = this.uploadedTracks();
    if (uploaded) return uploaded;
    return this.apiService.tracksResource.value() ?? [];
  });

  readonly rawData = computed(() => {
    const points = this.baseRawData();
    if (!points.length) return [];
    return this.qcEngine.runQC(points, this.filters().maxSpeedThreshold, this.manualOverrides());
  });

  readonly filteredData = computed(() => {
    const points = this.rawData();
    const criteria = this.filters();

    return points.filter((p) => {
      if (criteria.selectedIndividual !== 'ALL' && p.individualId !== criteria.selectedIndividual) {
        return false;
      }
      if (criteria.showOnlyFlagged && !p.isFlagged) {
        return false;
      }
      return true;
    });
  });

  readonly availableIndividuals = computed(() => {
    const ids = this.rawData().map((p) => p.individualId);
    return ['ALL', ...new Set(ids)];
  });

  dismissRestoration(): void {
    this.sessionRestored.set(false);
  }

  loadRawFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      try {
        const parsed = this.parserService.parseFile(content, file.name);
        this.uploadedTracks.set(parsed);
        this.manualOverrides.set(new Map());
      } catch (err) {
        console.error('Failed to parse uploaded file', err);
      }
    };
    reader.readAsText(file);
  }

  updateFilters(newFilters: Partial<FilterCriteria>): void {
    this.filters.update((curr) => ({ ...curr, ...newFilters }));
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  toggleOverride(pointId: string): void {
    this.manualOverrides.update((map) => {
      const newMap = new Map(map);
      const targetPoint = this.rawData().find((p) => p.id === pointId);
      if (targetPoint) {
        const currentFlagged = newMap.get(pointId)?.isFlagged ?? targetPoint.isFlagged;
        newMap.set(pointId, { isFlagged: !currentFlagged, manuallyOverridden: true });
      }
      return newMap;
    });
  }

  selectPoint(id: string | null): void {
    this.selectedPointId.set(id);
  }

  deletePoint(pointId: string): void {
    this.uploadedTracks.update((current) => {
      const base = current ?? this.apiService.tracksResource.value() ?? [];
      return base.filter((p) => p.id !== pointId);
    });

    if (this.selectedPointId() === pointId) {
      this.selectedPointId.set(null);
    }
  }

  exportData(format: 'csv' | 'json'): void {
    const data = this.filteredData();
    let content = format === 'json' ? JSON.stringify(data, null, 2) : '';
    const filename = `curated_tracks_${Date.now()}.${format}`;
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';

    if (format === 'csv') {
      const headers = [
        'ID',
        'Individual',
        'Timestamp',
        'Latitude',
        'Longitude',
        'Speed',
        'Accuracy',
        'Flagged',
      ];
      const rows = data.map((p) => [
        p.id,
        p.individualId,
        p.timestamp,
        p.latitude,
        p.longitude,
        p.speedKmH ?? 0,
        p.accuracyMeters,
        p.isFlagged,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
