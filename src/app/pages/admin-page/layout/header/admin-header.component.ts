import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ThemeService } from '../../../../services/theme.service';
import { NgxThemeToggleComponent, OmDarkIcon, OmLightIcon } from '@omnedia/ngx-theme-toggle';

@Component({
    selector: 'app-admin-header',
    standalone: true,
    imports: [CommonModule, NgxThemeToggleComponent, OmDarkIcon, OmLightIcon],
    templateUrl: './admin-header.component.html',
    styleUrl: './admin-header.component.css'
})
export class AdminHeaderComponent {
    private authService = inject(AuthService);
    public themeService = inject(ThemeService);
    private router = inject(Router);

    public currentTheme = this.themeService.theme$;

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/sign-in']);
    }
}
