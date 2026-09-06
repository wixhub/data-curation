/// <reference types="vitest/globals" />

import Dexie from 'dexie';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { DatabaseService } from './database.service';
import { TrackingPoint, FilterCriteria } from '../models/tracking.model';

describe('DatabaseService', () => {
  let dbService: DatabaseService;

  beforeEach(async () => {
    // Explicitly configure Dexie's isolated Node environment dependencies
    Dexie.dependencies.indexedDB = new IDBFactory();
    Dexie.dependencies.IDBKeyRange = IDBKeyRange;

    dbService = new DatabaseService();
    await dbService.delete();
    await dbService.open();
  });

  it('should initialize and have an empty session on start', async () => {
    const session = await dbService.getLatestSession();
    expect(session).toBeNull();
  });

  it('should save and retrieve the latest session', async () => {
    const tracks: TrackingPoint[] = [
      { id: '1', latitude: 10, longitude: 20, timestamp: 1000 } as any,
    ];
    const overrides = new Map<string, { isFlagged: boolean; manuallyOverridden: boolean }>();
    overrides.set('track-1', { isFlagged: true, manuallyOverridden: true });

    const filters: FilterCriteria = { search: 'test' } as any;

    await dbService.saveSession(tracks, overrides, filters);

    const latest = await dbService.getLatestSession();
    expect(latest).not.toBeNull();
    expect(latest?.uploadedTracks).toEqual(tracks);
    expect(latest?.manualOverrides).toEqual([
      ['track-1', { isFlagged: true, manuallyOverridden: true }],
    ]);
  });

  it('should clear all saved sessions', async () => {
    await dbService.saveSession([], new Map(), {} as any);
    await dbService.clearSession();
    const latest = await dbService.getLatestSession();
    expect(latest).toBeNull();
  });
});
