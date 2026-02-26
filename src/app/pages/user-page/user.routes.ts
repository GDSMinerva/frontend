// This file is used for lazy loading the routes in standalone applications if needed
import { Routes } from '@angular/router';
import { UserPageComponent } from './user-page.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { JobMatchingComponent } from './components/job-matching/job-matching.component';
import { InterviewSimulatorComponent } from './components/interview-simulator/interview-simulator.component';
import { CoursesProjectsComponent } from './components/courses-projects/courses-projects.component';
import { SupportFeedbackComponent } from './components/support-feedback/support-feedback.component';
import { ProfileComponent } from './components/profile/profile.component';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserPageComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'job-matching', component: JobMatchingComponent },
      { path: 'interview-simulator', component: InterviewSimulatorComponent },
      { path: 'courses-projects', component: CoursesProjectsComponent },
      { path: 'support-feedback', component: SupportFeedbackComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  }
];
