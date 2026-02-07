import { Component, inject, signal } from '@angular/core';
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

  /** Sidebar collapsed state: when true, sidebar is narrow and nav text is hidden. */
  sidebarCollapsed = signal(false);

  /** Active main content tab; synced with sidebar nav. */
  activeTab = signal<'dashboard' | 'job-matching' | 'interview-simulator' | 'courses-projects' | 'support-feedback'>('dashboard');

  readonly tabIds = ['dashboard', 'job-matching', 'interview-simulator', 'courses-projects', 'support-feedback'] as const;

  public currentTheme = this.themeService.theme$;

  authState$ = this.authService.authState$;

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

  setActiveTab(tab: typeof this.tabIds[number]): void {
    this.activeTab.set(tab);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
