import { TestBed } from '@angular/core/testing';
import { TrackingParserService } from './tracking-parser.service';

describe('TrackingParserService', () => {
  let service: TrackingParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrackingParserService],
    });
    service = TestBed.inject(TrackingParserService);
  });

  it('should parse JSON files correctly', () => {
    const jsonContent = JSON.stringify([
      {
        id: '1',
        individualId: 'Ind1',
        timestamp: '2026-01-01T00:00:00Z',
        latitude: 1,
        longitude: 2,
        accuracyMeters: 10,
        isFlagged: false,
      },
    ]);

    const result = service.parseFile(jsonContent, 'tracks.json');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  it('should parse CSV files correctly', () => {
    const csvContent =
      'id,individual,timestamp,latitude,longitude,accuracy,speed,flagged,flagreason\n1,Ind1,2026-01-01T00:00:00Z,10,20,15,30,false,';

    const result = service.parseFile(csvContent, 'tracks.csv');
    expect(result.length).toBe(1);
    expect(result[0].individualId).toBe('Ind1');
    expect(result[0].latitude).toBe(10);
  });

  it('should throw error on unsupported formats', () => {
    expect(() => service.parseFile('data', 'file.txt')).toThrowError('Unsupported file format');
  });
});
