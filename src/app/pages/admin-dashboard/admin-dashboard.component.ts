import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Router } from '@angular/router';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon } from '@omnedia/ngx-theme-toggle';
import { AdminSidebar } from '../../shared/components/admin-sidebar/admin-sidebar';
import { NgxDotpatternComponent } from '@omnedia/ngx-dotpattern';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon, NgxDotpatternComponent, AdminSidebar],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminDashboardComponent {
   private authService = inject(AuthService);
  public themeService = inject(ThemeService);
  private router = inject(Router);

  readonly tabIds = ['dashboard', 'User Management','Job Management','Training Catalog','Feedback'] as const;

  public currentTheme = this.themeService.theme$;
  

  authState$ = this.authService.authState$;



  logout(): void {
    this.authService.logout();
    this.router.navigate(['/sign-in']);
  }
}
