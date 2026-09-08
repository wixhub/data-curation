import { Service } from '@angular/core';
import { TrackingPoint } from '../models/tracking.model';

@Service()
export class GeospatialQcEngine {
  runQC(
    points: TrackingPoint[],
    speedLimit: number,
    overrides: Map<string, { isFlagged: boolean; manuallyOverridden: boolean }>,
  ): TrackingPoint[] {
    const sorted = [...points].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Track the last seen point independently for each individual
    const lastPointMap = new Map<string, TrackingPoint>();

    return sorted.map((point) => {
      const prev = lastPointMap.get(point.individualId);
      lastPointMap.set(point.individualId, point);

      let speed = 0;
      if (prev) {
        const distanceKm = this.haversine(
          prev.latitude,
          prev.longitude,
          point.latitude,
          point.longitude,
        );
        const timeHours =
          (new Date(point.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 3600000;
        speed = timeHours > 0 ? distanceKm / timeHours : 0;
      }

      const speedKmH = Number(speed.toFixed(1));
      let isFlagged = false;
      let reason = '';

      if (speed > speedLimit) {
        isFlagged = true;
        reason = `Excessive speed: ${speedKmH} km/h`;
      } else if (point.accuracyMeters > 100) {
        isFlagged = true;
        reason = `Low GPS accuracy: ${point.accuracyMeters}m`;
      }

      const override = overrides.get(point.id);
      if (override) {
        return {
          ...point,
          speedKmH,
          isFlagged: override.isFlagged,
          flagReason: override.isFlagged ? point.flagReason || 'Manually flagged' : '',
          manuallyOverridden: override.manuallyOverridden,
        };
      }

      return {
        ...point,
        speedKmH,
        isFlagged,
        flagReason: reason,
        manuallyOverridden: false,
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
}
