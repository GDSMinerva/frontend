import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon } from '@omnedia/ngx-theme-toggle';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);

  // expose the theme signal so the template can call it as `currentTheme()`
  public currentTheme = this.themeService.theme$;

  authState$ = this.authService.authState$;

  /** Sample job titles for "Use Sample Description" (single source of truth for template). */
  readonly sampleJobTitles = [
    'Developer',
    'Hadoop Developer',
    'Magento Developer',
    'Security Analyst',
    'Data Scientist',
    'Product Manager',
  ] as const;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/sign-in']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
