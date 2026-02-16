import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { NgxDotpatternComponent } from '@omnedia/ngx-dotpattern';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, NgxDotpatternComponent],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserPageComponent {
  isSidebarCollapsed = signal(false);
  isMobileSidebarOpen = signal(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }
}
