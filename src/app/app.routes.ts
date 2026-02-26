import { Routes } from '@angular/router';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'sign-in',
    component: SignInComponent
  },
  {
    path: 'sign-up',
    component: SignUpComponent
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard-host/dashboard-host.component').then(m => m.DashboardHostComponent)
  },
  {
    path: 'user',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/user-page/user.routes').then(m => m.USER_ROUTES)
  },
  {
    path: 'admin-page',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin-page/admin-page.component').then(m => m.AdminPageComponent),
    loadChildren: () => import('./pages/admin-page/admin-page.routes').then(m => m.adminPageRoutes)
  }
];
