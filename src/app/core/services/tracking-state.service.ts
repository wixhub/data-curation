import { Service, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { TrackingPoint, FilterCriteria } from '../models/tracking.model';

@Service()
export class TrackingStateService {
  private readonly http = inject(HttpClient);

  // Filter criteria signal holding the current state of filters
  readonly filters = signal<FilterCriteria>({
    startDate: null,
    endDate: null,
    selectedIndividual: 'ALL',
    showOnlyFlagged: false,
    maxSpeedThreshold: 50,
  });

  // Selected tracking point identifier signal
  readonly selectedPointId = signal<string | null>(null);

  // Modern stable rxResource handling asynchronous data fetching using the `stream` property
  private readonly tracksResource = rxResource({
    stream: () => this.http.get<TrackingPoint[]>('data/tracks.json'),
  });

  // Expose loading state derived from rxResource status
  readonly isLoading = computed(() => this.tracksResource.isLoading());

  // Raw data processed with Quality Control (QC) engine whenever raw fetch updates or speed threshold changes
  readonly rawData = computed(() => {
    const value = this.tracksResource.value();
    if (!value) return [];
    return this.runQCEngine(value, this.filters().maxSpeedThreshold);
  });

  // Filtered dataset computed efficiently based on current filter criteria
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

  // Unique list of available individuals derived from raw data
  readonly availableIndividuals = computed(() => {
    const ids = this.rawData().map((p) => p.individualId);
    return ['ALL', ...new Set(ids)];
  });

  // Manual override state tracking for specific points
  private readonly manualOverrides = signal<
    Map<string, { isFlagged: boolean; manuallyOverridden: boolean }>
  >(new Map());

  // Quality Control engine to calculate speeds, distances, and flag anomalies
  private runQCEngine(points: TrackingPoint[], speedLimit: number): TrackingPoint[] {
    const sorted = [...points].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const overrides = this.manualOverrides();

    return sorted.map((point, index, arr) => {
      // Apply existing manual overrides if present
      const override = overrides.get(point.id);
      if (override) {
        return { ...point, ...override };
      }

      if (index === 0) return { ...point, isFlagged: false };

      const prev = arr[index - 1];
      if (prev.individualId !== point.individualId) return { ...point, isFlagged: false };

      const distanceKm = this.haversine(
        prev.latitude,
        prev.longitude,
        point.latitude,
        point.longitude,
      );
      const timeHours =
        (new Date(point.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 3600000;
      const speed = timeHours > 0 ? distanceKm / timeHours : 0;

      let isFlagged = false;
      let reason = '';

      if (speed > speedLimit) {
        isFlagged = true;
        reason = `Excessive speed: ${speed.toFixed(1)} km/h`;
      } else if (point.accuracyMeters > 100) {
        isFlagged = true;
        reason = `Low GPS accuracy: ${point.accuracyMeters}m`;
      }

      return {
        ...point,
        speedKmH: Number(speed.toFixed(1)),
        isFlagged,
        flagReason: reason,
      };
    });
  }

  // Haversine formula for calculating distance between two coordinates
  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Update current filter settings
  updateFilters(newFilters: Partial<FilterCriteria>): void {
    this.filters.update((curr) => ({ ...curr, ...newFilters }));
  }

  // Toggle flag status and mark point as manually overridden
  toggleOverride(pointId: string): void {
    this.manualOverrides.update((map) => {
      const newMap = new Map(map);
      const rawPoints = this.tracksResource.value() ?? [];
      const targetPoint = rawPoints.find((p) => p.id === pointId);

      if (targetPoint) {
        const currentOverride = newMap.get(pointId);
        const currentFlagged = currentOverride ? currentOverride.isFlagged : targetPoint.isFlagged;

        newMap.set(pointId, {
          isFlagged: !currentFlagged,
          manuallyOverridden: true,
        });
      }
      return newMap;
    });
  }

  // Set selected tracking point ID
  selectPoint(id: string | null): void {
    this.selectedPointId.set(id);
  }

  // Export filtered tracking data into CSV or JSON formats
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
