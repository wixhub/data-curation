import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapInspector } from './map-inspector';

describe('MapInspector', () => {
  let component: MapInspector;
  let fixture: ComponentFixture<MapInspector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapInspector],
    }).compileComponents();

    fixture = TestBed.createComponent(MapInspector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
