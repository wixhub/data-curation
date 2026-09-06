import { Service, DestroyRef, inject } from '@angular/core';
import * as L from 'leaflet';
import { TrackingPoint } from '../models/tracking.model';
import { environment } from '../../../environments/environment';

@Service()
export class LeafletMapService {
  private mapInstance: L.Map | null = null;
  private readonly markerLayerGroup = L.layerGroup();
  private readonly vectorLayerGroup = L.layerGroup();
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.disposeMap();
    });
  }

  public initializeMap(
    containerId: string,
    initialCenter: [number, number] = [20, 0],
    zoom: number = 3,
  ): void {
    if (this.mapInstance) return;

    this.mapInstance = L.map(containerId, {
      zoomControl: false,
      attributionControl: true,
    }).setView(initialCenter, zoom);

    L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${environment.cartoApiKey}`,
      {
        attribution: '&copy; CARTO',
        maxZoom: 19,
        subdomains: 'abcd',
      },
    ).addTo(this.mapInstance);

    this.markerLayerGroup.addTo(this.mapInstance);
    this.vectorLayerGroup.addTo(this.mapInstance);

    setTimeout(() => {
      this.mapInstance?.invalidateSize();
    }, 150);
  }

  public renderTelemetryPoints(records: readonly TrackingPoint[]): void {
    if (!this.mapInstance) return;

    this.markerLayerGroup.clearLayers();
    this.vectorLayerGroup.clearLayers();

    const allLatLngs: L.LatLngExpression[] = [];
    const individualTracks = new Map<string, { latLngs: [number, number][]; color: string }>();

    records.forEach((record) => {
      const latLng: [number, number] = [record.latitude, record.longitude];
      allLatLngs.push(latLng);

      // Assign or retrieve a consistent color per individual
      if (!individualTracks.has(record.individualId)) {
        individualTracks.set(record.individualId, {
          latLngs: [],
          color: this.getIndividualColor(record.individualId),
        });
      }

      const trackData = individualTracks.get(record.individualId)!;
      trackData.latLngs.push(latLng);

      // Status overrides color if flagged, otherwise uses individual color
      const markerColor = record.isFlagged ? '#ef4444' : trackData.color;

      const marker = L.circleMarker(latLng, {
        radius: 6,
        fillColor: markerColor,
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      marker.bindPopup(`
        <div style="font-family:sans-serif; font-size:12px;">
          <strong>Subject:</strong> ${record.individualId}<br/>
          <strong>Speed:</strong> ${record.speedKmH ?? 0} km/h<br/>
          <strong>Accuracy:</strong> ${record.accuracyMeters}m<br/>
          <strong>Time:</strong> ${new Date(record.timestamp).toLocaleTimeString()}
        </div>
      `);

      this.markerLayerGroup.addLayer(marker);
    });

    // Render individual polylines using their designated color
    individualTracks.forEach(({ latLngs, color }) => {
      if (latLngs.length > 1) {
        const polyline = L.polyline(latLngs, {
          color: color,
          weight: 2.5,
          dashArray: '4, 8',
          opacity: 0.8,
        });
        this.vectorLayerGroup.addLayer(polyline);
      }
    });

    if (allLatLngs.length > 0) {
      const bounds = L.latLngBounds(allLatLngs);
      this.mapInstance.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 14,
      });
    }
  }

  private getIndividualColor(id: string): string {
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  public disposeMap(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  }
}
