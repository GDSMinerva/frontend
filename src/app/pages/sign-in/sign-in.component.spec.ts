import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignInComponent } from './sign-in.component';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { vi } from 'vitest';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let authServiceSpy: any;
  let routerSpy: any;
  let themeServiceSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      login: vi.fn(),
      authState$: of({})
    };
    routerSpy = {
      navigate: vi.fn()
    };
    themeServiceSpy = {
      theme$: of('light')
    };

    await TestBed.configureTestingModule({
      imports: [SignInComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle hardcoded user login', () => {
    component.form.setValue({ email: 'sirineidoudi@mail.com', password: '12345678' });
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/user']);
  });

  it('should handle hardcoded admin login', () => {
    component.form.setValue({ email: 'admin@gmail.com', password: 'azertyui' });
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin-page']);
  });

  it('should call AuthService login for other users', () => {
    const mockUser = { email: 'test@test.com', password: 'password123' };
    component.form.setValue(mockUser);
    authServiceSpy.login.mockReturnValue(of({ accessToken: 'token' }));

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith(mockUser);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle login error', () => {
    const mockUser = { email: 'test@test.com', password: 'password123' };
    component.form.setValue(mockUser);
    authServiceSpy.login.mockReturnValue(throwError(() => ({ message: 'Login failed' })));

    component.onSubmit();

    expect(component.errorMessage()).toBe('Login failed');
    expect(component.loading()).toBe(false);
  });
});
