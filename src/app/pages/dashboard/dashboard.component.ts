import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon } from '@omnedia/ngx-theme-toggle';
import { NgxTypewriterComponent } from '@omnedia/ngx-typewriter';
import { NgxDotpatternComponent } from '@omnedia/ngx-dotpattern';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon, NgxTypewriterComponent, NgxDotpatternComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);

  /** Sidebar collapsed state: when true, sidebar is narrow and nav text is hidden. */
  sidebarCollapsed = signal(false);

  /** Mobile sidebar visibility state */
  isMobileSidebarOpen = signal(false);

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
    this.closeMobileSidebar();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
