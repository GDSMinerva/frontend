import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardHostComponent } from './dashboard-host.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { vi } from 'vitest';

describe('DashboardHostComponent', () => {
  let component: DashboardHostComponent;
  let fixture: ComponentFixture<DashboardHostComponent>;
  let authServiceSpy: any;
  let routerSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      getAuthState: vi.fn(),
      decodeToken: vi.fn()
    };
    routerSpy = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardHostComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DashboardHostComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to admin dashboard for admin role', () => {
    authServiceSpy.getAuthState.mockReturnValue({ user: { role: 'admin' } });

    component.ngOnInit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin-page']);
  });

  it('should navigate to user dashboard for user role', () => {
    authServiceSpy.getAuthState.mockReturnValue({ user: { role: 'user' } });

    component.ngOnInit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/user']);
  });

  it('should default to user dashboard if no role found', () => {
    authServiceSpy.getAuthState.mockReturnValue({ user: null });
    authServiceSpy.decodeToken.mockReturnValue(null);

    component.ngOnInit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/user']);
  });
});
