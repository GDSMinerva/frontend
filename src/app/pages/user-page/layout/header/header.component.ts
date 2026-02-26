import { Component, EventEmitter, inject, Input, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';
import { ThemeService } from '../../../../services/theme.service';
import { ProfileService } from '../../../../services/profile.service';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon } from '@omnedia/ngx-theme-toggle';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HeaderComponent {
  @Input() isMobileSidebarOpen = false;
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  authState$ = this.authService.authState$;
  userProfile = this.profileService.userProfile$;

  toggleMobile(): void {
    this.toggleMobileSidebar.emit();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/sign-in']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/user/profile']);
  }
}
