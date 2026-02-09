import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { vi } from 'vitest';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
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
      toggleTheme: vi.fn(),
      theme$: of('light')
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sidebar', () => {
    const initialState = component.sidebarCollapsed();
    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(!initialState);
  });

  it('should toggle mobile sidebar', () => {
    const initialState = component.isMobileSidebarOpen();
    component.toggleMobileSidebar();
    expect(component.isMobileSidebarOpen()).toBe(!initialState);
  });

  it('should set active tab and close mobile sidebar', () => {
    component.isMobileSidebarOpen.set(true);
    component.setActiveTab('job-matching');
    expect(component.activeTab()).toBe('job-matching');
    expect(component.isMobileSidebarOpen()).toBe(false);
  });

  it('should logout and navigate', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/sign-in']);
  });
});
