import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LoginRequest } from '../../models/auth.model';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon } from '@omnedia/ngx-theme-toggle';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.errorMessage.set('Please fill in all fields correctly');
      return;
    }

    const email = this.form.get('email')?.value || '';
    const password = this.form.get('password')?.value || '';

    this.loading.set(true);
    this.errorMessage.set(null);

    // Check credentials and route accordingly
    if (email === 'sirineidoudi@mail.com' && password === '12345678') {
      // Set authentication state for user
      localStorage.setItem('access_token', 'user_token_12345');
      localStorage.setItem('user', JSON.stringify({ email, firstName: 'User', role: 'user' }));
      this.loading.set(false);
      this.router.navigate(['/dashboard/user']);
      return;
    }

    if (email === 'admin@gmail.com' && password === 'azertyui') {
      // Set authentication state for admin
      localStorage.setItem('access_token', 'admin_token_67890');
      localStorage.setItem('user', JSON.stringify({ email, firstName: 'Admin', role: 'admin' }));
      this.loading.set(false);
      this.router.navigate(['/dashboard/admin']);
      return;
    }

    const credentials: LoginRequest = {
      email: email,
      password: password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.message || 'Login failed. Please try again.');
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  signInWithGoogle(): void {
    // Implement Google OAuth flow
    console.log('Sign in with Google');
  }

  signInWithLinkedIn(): void {
    // Implement LinkedIn OAuth flow
    console.log('Sign in with LinkedIn');
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }
}
