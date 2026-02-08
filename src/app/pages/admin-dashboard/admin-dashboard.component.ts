import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Router } from '@angular/router';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon } from '@omnedia/ngx-theme-toggle';
import { NgxTypewriterComponent } from '@omnedia/ngx-typewriter';
import { NgxDotpatternComponent } from '@omnedia/ngx-dotpattern';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon, NgxTypewriterComponent, NgxDotpatternComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminDashboardComponent {
  private auth = inject(AuthService);
  public themeService = inject(ThemeService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  isMobileSidebarOpen = signal(false);
  authState$ = this.auth.authState$;

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/sign-in']);
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
}
