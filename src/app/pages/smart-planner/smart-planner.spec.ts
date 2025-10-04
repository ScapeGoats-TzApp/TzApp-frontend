import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartPlanner } from './smart-planner';

describe('SmartPlanner', () => {
  let component: SmartPlanner;
  let fixture: ComponentFixture<SmartPlanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartPlanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartPlanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
