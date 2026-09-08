import { TestBed } from '@angular/core/testing';
import { Header } from './header';
import { TrackingStateService } from '../../services/tracking-state.service';

describe('Header', () => {
  let component: Header;
  let fixture: any;
  let trackingStateServiceMock: { loadRawFile: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    trackingStateServiceMock = {
      loadRawFile: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [{ provide: TrackingStateService, useValue: trackingStateServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadRawFile on TrackingStateService when a file is selected', () => {
    const mockFile = new File(['dummy content'], 'test.csv', { type: 'text/csv' });
    const event = {
      target: {
        files: [mockFile],
      },
    } as unknown as Event;

    component.onFileSelected(event);

    expect(trackingStateServiceMock.loadRawFile).toHaveBeenCalledTimes(1);
    expect(trackingStateServiceMock.loadRawFile).toHaveBeenCalledWith(mockFile);
  });

  it('should not call loadRawFile if no files are selected', () => {
    const event = {
      target: {
        files: [],
      },
    } as unknown as Event;

    component.onFileSelected(event);

    expect(trackingStateServiceMock.loadRawFile).not.toHaveBeenCalled();
  });
});
