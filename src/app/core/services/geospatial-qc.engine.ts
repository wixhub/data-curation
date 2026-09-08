import { Service } from '@angular/core';
import { GeospatialQcOptions, TrackingPoint } from '../models/tracking.model';

@Service()
export class GeospatialQcEngine {
  run(points: TrackingPoint[], options: GeospatialQcOptions): TrackingPoint[] {
    const { maxSpeedThreshold, manualOverrides } = options;

    const sorted = [...points].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Track the last seen point independently for each individual
    const lastPointMap = new Map<string, TrackingPoint>();

    return sorted.map((point) => {
      const previousPoint = lastPointMap.get(point.individualId);
      lastPointMap.set(point.individualId, point);

      const speedKmH = previousPoint ? this.calculateSpeed(previousPoint, point) : 0;
      const automaticResult = this.evaluatePoint(point, speedKmH, maxSpeedThreshold);
      const override = manualOverrides.get(point.id);

      if (override) {
        return {
          ...point,
          speedKmH,
          isFlagged: override.isFlagged,
          flagReason: override.isFlagged ? 'Manually flagged' : '',
          manuallyOverridden: override.manuallyOverridden,
        };
      }

      return {
        ...point,
        speedKmH,
        isFlagged: automaticResult.isFlagged,
        flagReason: automaticResult.flagReason,
        manuallyOverridden: false,
      };
    });
  }

  private calculateSpeed(previous: TrackingPoint, current: TrackingPoint): number {
    const previousTimestamp = new Date(previous.timestamp).getTime();
    const currentTimestamp = new Date(current.timestamp).getTime();
    const timeHours = (currentTimestamp - previousTimestamp) / 3_600_000;

    if (timeHours <= 0) {
      return 0;
    }

    const distanceKm = this.haversine(
      previous.latitude,
      previous.longitude,
      current.latitude,
      current.longitude,
    );

    return Number((distanceKm / timeHours).toFixed(1));
  }

  private evaluatePoint(
    point: TrackingPoint,
    speedKmH: number,
    maxSpeedThreshold: number,
  ): { isFlagged: boolean; flagReason: string } {
    if (speedKmH > maxSpeedThreshold) {
      return { isFlagged: true, flagReason: `Excessive speed: ${speedKmH} km/h` };
    }

    if (point.accuracyMeters > 100) {
      return { isFlagged: true, flagReason: `Low GPS accuracy: ${point.accuracyMeters}m` };
    }

    return { isFlagged: false, flagReason: '' };
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const rLat1 = this.toRadians(lat1);
    const rLat2 = this.toRadians(lat2);

    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;

    const clampedA = Math.min(1, Math.max(0, a));
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
