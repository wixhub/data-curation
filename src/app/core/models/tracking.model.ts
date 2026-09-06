export type ViewMode = 'split' | 'table-only' | 'map-only';

export interface TrackingPoint {
  id: string;
  individualId: string;
  timestamp: string; // ISO string
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
  maxSpeedThreshold: number; // km/h
}

export interface CurationSession {
  id?: number;
  timestamp: number;
  uploadedTracks: TrackingPoint[];
  manualOverrides: Array<[string, { isFlagged: boolean; manuallyOverridden: boolean }]>;
  filters: FilterCriteria;
}
