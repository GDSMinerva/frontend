import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { JobManagementComponent } from './components/job-management/job-management.component';
import { TrainingCatalogComponent } from './components/training-catalog/training-catalog.component';
import { FeedbackComponent } from './components/feedback/feedback.component';

export const adminPageRoutes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: DashboardComponent
    },
    {
        path: 'user-management',
        component: UserManagementComponent
    },
    {
        path: 'job-management',
        component: JobManagementComponent
    },
    {
        path: 'training-catalog',
        component: TrainingCatalogComponent
    },
    {
        path: 'feedback',
        component: FeedbackComponent
    }
];
