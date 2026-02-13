import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-job-management',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Job Management</h2>
      <p class="text-slate-600 dark:text-slate-400">Job management features will be implemented here.</p>
    </div>
  `
})
export class JobManagementComponent {
}
