import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TrackingPoint, FilterCriteria } from '../models/tracking.model';

@Injectable({ providedIn: 'root' })
export class TrackingStateService {
  private http = inject(HttpClient);

  readonly rawData = signal<TrackingPoint[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly selectedPointId = signal<string | null>(null);

  readonly filters = signal<FilterCriteria>({
    startDate: null,
    endDate: null,
    selectedIndividual: 'ALL',
    showOnlyFlagged: false,
    maxSpeedThreshold: 50,
  });

  constructor() {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoading.set(true);
    this.http.get<TrackingPoint[]>('data/tracks.json').subscribe({
      next: (data) => {
        const processed = this.runQCEngine(data, this.filters().maxSpeedThreshold);
        this.rawData.set(processed);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

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

  private runQCEngine(points: TrackingPoint[], speedLimit: number): TrackingPoint[] {
    const sorted = [...points].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return sorted.map((point, index, arr) => {
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

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  updateFilters(newFilters: Partial<FilterCriteria>): void {
    this.filters.update((curr) => {
      const updated = { ...curr, ...newFilters };
      if (newFilters.maxSpeedThreshold !== undefined) {
        this.rawData.set(this.runQCEngine(this.rawData(), updated.maxSpeedThreshold));
      }
      return updated;
    });
  }

  toggleOverride(pointId: string): void {
    this.rawData.update((points) =>
      points.map((p) =>
        p.id === pointId ? { ...p, isFlagged: !p.isFlagged, manuallyOverridden: true } : p,
      ),
    );
  }

  selectPoint(id: string | null): void {
    this.selectedPointId.set(id);
  }

  exportData(format: 'csv' | 'json'): void {
    const data = this.filteredData();
    let content = format === 'json' ? JSON.stringify(data, null, 2) : '';
    let filename = `curated_tracks_${Date.now()}.${format}`;
    let mimeType = format === 'json' ? 'application/json' : 'text/csv';

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
