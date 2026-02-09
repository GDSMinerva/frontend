import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignUpComponent } from './sign-up.component';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { vi } from 'vitest';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let authServiceSpy: any;
  let routerSpy: any;
  let themeServiceSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      signUp: vi.fn(),
      authState$: of({})
    };
    routerSpy = {
      navigate: vi.fn()
    };
    themeServiceSpy = {
      theme$: of('light')
    };

    await TestBed.configureTestingModule({
      imports: [SignUpComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hardcoded user navigate to user dashboard', () => {
    component.form.setValue({ email: 'sirineidoudi@mail.com', password: '12345678' });
    component.onSubmit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/user']);
  });

  it('should call AuthService signUp for new users', () => {
    const mockUser = { email: 'new@test.com', password: 'password123' };
    component.form.setValue(mockUser);
    authServiceSpy.signUp.mockReturnValue(of({ accessToken: 'token' }));

    component.onSubmit();

    expect(authServiceSpy.signUp).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle sign up error', () => {
    const mockUser = { email: 'new@test.com', password: 'password123' };
    component.form.setValue(mockUser);
    authServiceSpy.signUp.mockReturnValue(throwError(() => ({ message: 'Error' })));

    component.onSubmit();

    expect(component.errorMessage()).toBe('Error');
  });
});
