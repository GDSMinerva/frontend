import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { AdminSidebar } from './layout/sidebar/admin-sidebar';
import { AdminHeaderComponent } from './layout/header/admin-header.component';
import { NgxDotpatternComponent } from '@omnedia/ngx-dotpattern';

@Component({
    selector: 'app-admin-page',
    standalone: true,
    imports: [CommonModule, RouterOutlet, AdminSidebar, AdminHeaderComponent, NgxDotpatternComponent],
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.css'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminPageComponent {
    private authService = inject(AuthService);
    public themeService = inject(ThemeService);

    authState$ = this.authService.authState$;
}
