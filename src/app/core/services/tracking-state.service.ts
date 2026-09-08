import { Service, computed, effect, inject, signal } from '@angular/core';
import { TrackingApiService } from './tracking-api.service';
import { TrackingParserService } from './tracking-parser.service';
import { GeospatialQcEngine } from './geospatial-qc.engine';
import { DatabaseService } from './database.service';
import { exportTrackingData } from '../utils/export.utils';
import { FilterCriteria, ManualOverride, TrackingPoint, ViewMode } from '../models/tracking.model';

@Service()
export class TrackingStateService {
  private readonly apiService = inject(TrackingApiService);
  private readonly parserService = inject(TrackingParserService);
  private readonly qcEngine = inject(GeospatialQcEngine);
  private readonly dbService = inject(DatabaseService);
  private initializationCompleted = false;
  private restorationTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly uploadedTracks = signal<TrackingPoint[] | null>(null);
  readonly manualOverrides = signal<Map<string, ManualOverride>>(new Map());
  readonly viewMode = signal<ViewMode>('split');
  readonly sessionRestored = signal<boolean>(false);
  readonly selectedPointId = signal<string | null>(null);

  readonly defaultFilters: FilterCriteria = {
    startDate: null,
    endDate: null,
    selectedIndividual: 'ALL',
    showOnlyFlagged: false,
    maxSpeedThreshold: 50,
  };

  readonly filters = signal<FilterCriteria>({ ...this.defaultFilters });
  readonly isLoading = computed(() => this.apiService.tracksResource.isLoading());

  readonly baseRawData = computed(() => {
    const uploaded = this.uploadedTracks();
    if (uploaded !== null) {
      return uploaded;
    }
    return this.apiService.tracksResource.value() ?? [];
  });

  readonly rawData = computed(() => {
    return this.qcEngine.run(this.baseRawData(), {
      maxSpeedThreshold: this.filters().maxSpeedThreshold,
      manualOverrides: this.manualOverrides(),
    });
  });

  readonly availableIndividuals = computed(() => {
    const ids = new Set(
      this.rawData()
        .map((point) => point.individualId)
        .filter(Boolean),
    );
    return ['ALL', ...Array.from(ids).sort()];
  });

  readonly filteredData = computed(() => {
    const data = this.rawData();
    const currentFilters = this.filters();

    return data.filter((point) => {
      if (
        currentFilters.selectedIndividual !== 'ALL' &&
        point.individualId !== currentFilters.selectedIndividual
      ) {
        return false;
      }
      if (currentFilters.showOnlyFlagged && !point.isFlagged) {
        return false;
      }
      if (currentFilters.startDate && point.timestamp < currentFilters.startDate) {
        return false;
      }
      if (currentFilters.endDate && point.timestamp > currentFilters.endDate) {
        return false;
      }
      return true;
    });
  });

  constructor() {
    // Automatically trigger session auto-save on state changes
    effect(() => {
      const tracks = this.uploadedTracks();
      const overrides = this.manualOverrides();
      const currentFilters = this.filters();

      if (!this.initializationCompleted || tracks === null) {
        return;
      }

      void this.dbService.saveSession(tracks, overrides, currentFilters);
    });

    effect(() => {
      const apiTracks = this.apiService.tracksResource.value();
      if (!apiTracks || this.initializationCompleted) {
        return;
      }

      void this.initializeSession(apiTracks);
    });
  }

  private async initializeSession(apiTracks: TrackingPoint[]): Promise<void> {
    this.initializationCompleted = true;

    try {
      const session = await this.dbService.getLatestSession();

      if (session) {
        this.uploadedTracks.set([...session.uploadedTracks]);
        this.manualOverrides.set(new Map(session.manualOverrides));

        this.filters.set({
          ...this.defaultFilters,
          ...(session.filters ?? {}),
        });

        this.sessionRestored.set(true);
        this.triggerAutoDismiss();
        return;
      }

      this.uploadedTracks.set([...apiTracks]);
      await this.dbService.saveSession(apiTracks, new Map(), this.filters());
    } catch (error) {
      console.error('Failed to initialize session from IndexedDB.', error);
      this.uploadedTracks.set([...apiTracks]);
    }
  }

  async restoreLatestSession(): Promise<void> {
    try {
      const session = await this.dbService.getLatestSession();
      if (!session) return;

      this.uploadedTracks.set([...session.uploadedTracks]);
      this.manualOverrides.set(new Map(session.manualOverrides));

      this.filters.set({
        ...this.defaultFilters,
        ...(session.filters ?? {}),
      });

      this.selectedPointId.set(null);
      this.sessionRestored.set(true);
      this.triggerAutoDismiss();
      this.initializationCompleted = true;
    } catch (error) {
      console.error('Failed to restore tracking session.', error);
    }
  }

  dismissRestoration(): void {
    if (this.restorationTimeout) {
      clearTimeout(this.restorationTimeout);
      this.restorationTimeout = null;
    }
    this.sessionRestored.set(false);
  }

  private triggerAutoDismiss(): void {
    if (this.restorationTimeout) {
      clearTimeout(this.restorationTimeout);
    }
    this.restorationTimeout = setTimeout(() => {
      this.dismissRestoration();
    }, 5000);
  }

  loadRawFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result;
        if (typeof content !== 'string') return;

        const parsed = this.parserService.parseFile(content, file.name);
        if (!parsed || parsed.length === 0) return;

        this.resetDatasetState();
        this.uploadedTracks.set([...parsed]);
      } catch (error) {
        console.error('Failed to parse uploaded tracking file.', error);
      }
    };
    reader.readAsText(file);
  }

  updateFilters(changes: Partial<FilterCriteria>): void {
    this.filters.update((current) => ({ ...current, ...changes }));
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  toggleOverride(pointId: string): void {
    const point = this.rawData().find((item) => item.id === pointId);
    if (!point) return;

    this.manualOverrides.update((current) => {
      const next = new Map(current);
      next.set(pointId, {
        isFlagged: !point.isFlagged,
        manuallyOverridden: true,
      });
      return next;
    });
  }

  selectPoint(pointId: string | null): void {
    this.selectedPointId.set(pointId);
  }

  deletePoint(pointId: string): void {
    const currentTracks = this.uploadedTracks();
    if (currentTracks === null) return;

    this.uploadedTracks.set(currentTracks.filter((point) => point.id !== pointId));
    this.manualOverrides.update((current) => {
      const next = new Map(current);
      next.delete(pointId);
      return next;
    });

    if (this.selectedPointId() === pointId) {
      this.selectedPointId.set(null);
    }
  }

  private resetDatasetState(): void {
    this.manualOverrides.set(new Map());
    this.filters.set({ ...this.defaultFilters });
    this.selectedPointId.set(null);
    this.sessionRestored.set(false);
  }

  async clearCurrentSession(): Promise<void> {
    try {
      await this.dbService.clearSession();
    } catch (error) {
      console.error('Failed to clear session from IndexedDB.', error);
    }

    this.uploadedTracks.set(null);
    this.resetDatasetState();
    this.initializationCompleted = false;
  }

  /**
   * Triggers file export of the currently filtered dataset.
   */
  exportData(format: 'csv' | 'json'): void {
    exportTrackingData(this.filteredData(), format);
  }
}
