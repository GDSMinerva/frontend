import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon } from '@omnedia/ngx-theme-toggle';
import { UserSidebar } from '../../shared/components/user-sidebar/user-sidebar';
import { NgxDotpatternComponent } from '@omnedia/ngx-dotpattern';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon, NgxDotpatternComponent, UserSidebar],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);

  /** Selected sample job descriptions (multiple selection) */
  selectedSampleJobs = signal<string[]>([]);

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



  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleSampleJob(job: string): void {
    const currentJobs = this.selectedSampleJobs();
    if (currentJobs.includes(job)) {
      // Remove job if already selected
      this.selectedSampleJobs.set(currentJobs.filter(j => j !== job));
    } else {
      // Add job if not selected
      this.selectedSampleJobs.set([...currentJobs, job]);
    }
  }

  isSampleJobSelected(job: string): boolean {
    return this.selectedSampleJobs().includes(job);
  }
}