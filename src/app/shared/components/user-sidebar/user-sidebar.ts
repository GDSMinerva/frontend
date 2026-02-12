import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-sidebar.html',
  styleUrl: './user-sidebar.css'
})
export class UserSidebar {
  sidebarCollapsed = signal(false);
  isMobileSidebarOpen = signal(false);
  activeTab = signal<'dashboard' | 'job-matching' | 'interview-simulator' | 'courses-projects' | 'support-feedback'>('dashboard');

  readonly tabIds = ['dashboard', 'job-matching', 'interview-simulator', 'courses-projects', 'support-feedback'] as const;

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
}
