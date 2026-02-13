import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminSidebar } from '../../shared/components/admin-sidebar/admin-sidebar';
import { By } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { vi } from 'vitest';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let authServiceSpy: any;
  let routerSpy: any;
  let themeServiceSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      logout: vi.fn(),
      authState$: of({})
    };
    routerSpy = {
      navigate: vi.fn()
    };
    themeServiceSpy = {
      theme$: of('light')
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sidebar', () => {
    const sidebarDebugElement = fixture.debugElement.query(By.directive(AdminSidebar));
    const sidebarComponent = sidebarDebugElement.componentInstance;

    const initialState = sidebarComponent.sidebarCollapsed();
    sidebarComponent.toggleSidebar();
    expect(sidebarComponent.sidebarCollapsed()).toBe(!initialState);
  });

  it('should logout and navigate', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/sign-in']);
  });
});
