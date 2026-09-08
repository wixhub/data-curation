import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportTrackingData } from './export.utils';
import { TrackingPoint } from '../models/tracking.model';

describe('exportTrackingData', () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let clickMock: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;

  const mockPoints: TrackingPoint[] = [
    {
      id: '1',
      individualId: 'wolf-1',
      timestamp: '2026-09-08T12:00:00Z',
      latitude: 47.0,
      longitude: 9.0,
      speedKmH: 12.5,
      accuracyMeters: 10,
      isFlagged: false,
    },
  ];

  beforeEach(() => {
    createObjectURLMock = vi.fn().mockReturnValue('blob:url');
    revokeObjectURLMock = vi.fn();
    clickMock = vi.fn();

    // Mock global URL methods
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    // Mock anchor element creation and behavior
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: clickMock,
        } as unknown as HTMLAnchorElement;
      }
      return document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should not trigger download if data array is empty', () => {
    exportTrackingData([], 'json');
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it('should successfully export data as JSON', () => {
    exportTrackingData(mockPoints, 'json');

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('application/json');
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:url');
  });

  it('should successfully export data as CSV with proper headers', () => {
    exportTrackingData(mockPoints, 'csv');

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    expect(blobArg.type).toContain('text/csv');
    expect(clickMock).toHaveBeenCalledTimes(1);
  });
});
