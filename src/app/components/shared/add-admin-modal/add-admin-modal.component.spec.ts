import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AddAdminModalComponent } from './add-admin-modal.component';
import { AdminService } from '../../../services/admin.service';

describe('AddAdminModalComponent', () => {
  let component: AddAdminModalComponent;
  let fixture: ComponentFixture<AddAdminModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddAdminModalComponent ],
      imports: [ ReactiveFormsModule, HttpClientTestingModule ],
      providers: [ AdminService ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddAdminModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with required validators', () => {
    expect(component.adminForm).toBeDefined();
    expect(component.adminForm.get('email')).toBeTruthy();
    expect(component.adminForm.get('password')).toBeTruthy();
    expect(component.adminForm.get('firstName')).toBeTruthy();
    expect(component.adminForm.get('lastName')).toBeTruthy();
  });

  it('should emit cancelled event when onCancel is called', () => {
    spyOn(component.cancelled, 'emit');
    component.onCancel();
    expect(component.cancelled.emit).toHaveBeenCalled();
  });
});