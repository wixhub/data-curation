import { Service } from '@angular/core';
import Dexie, { Table } from 'dexie';
import {
  CurationSession,
  FilterCriteria,
  ManualOverride,
  TrackingPoint,
} from '../models/tracking.model';

@Service()
export class DatabaseService extends Dexie {
  // Declare the sessions table for TypeScript type safety
  sessions!: Table<CurationSession, number>;

  constructor() {
    super('FaunaQCCurationDB');

    // Define database schema version 1 with primary key 'id' and indexed 'timestamp'
    this.version(1).stores({
      sessions: '++id, timestamp',
    });
  }

  /**
   * Persists the current session state into IndexedDB.
   * Clears previous sessions to keep only the latest auto-save state.
   */
  async saveSession(
    tracks: TrackingPoint[],
    overrides: Map<string, ManualOverride>,
    filters: FilterCriteria,
  ): Promise<void> {
    const serializedOverrides: CurationSession['manualOverrides'] = Array.from(overrides.entries());

    await this.transaction('rw', this.sessions, async () => {
      await this.sessions.clear();
      await this.sessions.add({
        timestamp: Date.now(),
        uploadedTracks: [...tracks],
        manualOverrides: serializedOverrides,
        filters: { ...filters },
      });
    });
  }

  /**
   * Retrieves the most recent curation session from IndexedDB.
   */
  async getLatestSession(): Promise<CurationSession | null> {
    const latest = await this.sessions.orderBy('timestamp').last();
    return latest ?? null;
  }

  /**
   * Clears all saved sessions from the local database.
   */
  async clearSession(): Promise<void> {
    await this.transaction('rw', this.sessions, async () => {
      await this.sessions.clear();
    });
  }
}
