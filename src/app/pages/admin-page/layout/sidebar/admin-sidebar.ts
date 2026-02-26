import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css'
})
export class AdminSidebar {
  private authService = inject(AuthService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  isMobileSidebarOpen = signal(false);
  activeTab = signal<'dashboard' | 'User Management' | 'Job Management' | 'Training Catalog' | 'Feedback'>('dashboard');

  readonly tabIds = ['dashboard', 'User Management', 'Job Management', 'Training Catalog', 'Feedback'] as const;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/sign-in']);
  }

  setActiveTab(tab: typeof this.tabIds[number]): void {
    this.activeTab.set(tab);
    this.closeMobileSidebar();

    // Navigate to the appropriate route
    const routeMap: Record<typeof this.tabIds[number], string> = {
      'dashboard': '/admin-page/dashboard',
      'User Management': '/admin-page/user-management',
      'Job Management': '/admin-page/job-management',
      'Training Catalog': '/admin-page/training-catalog',
      'Feedback': '/admin-page/feedback'
    };

    this.router.navigate([routeMap[tab]]);
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
