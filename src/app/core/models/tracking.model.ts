export type ViewMode = 'split' | 'table-only' | 'map-only';

export interface TrackingPoint {
  id: string;
  individualId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speedKmH?: number;
  accuracyMeters: number;
  isFlagged: boolean;
  flagReason?: string;
  manuallyOverridden?: boolean;
}

export interface FilterCriteria {
  startDate: string | null;
  endDate: string | null;
  selectedIndividual: string;
  showOnlyFlagged: boolean;
  maxSpeedThreshold: number;
}

export interface ManualOverride {
  isFlagged: boolean;
  manuallyOverridden: boolean;
}

export interface CurationSession {
  id?: number;
  timestamp: number;
  uploadedTracks: TrackingPoint[];
  manualOverrides: Array<[string, ManualOverride]>;
  filters: FilterCriteria;
}

export interface GeospatialQcOptions {
  maxSpeedThreshold: number;
  manualOverrides: Map<string, ManualOverride>;
}
