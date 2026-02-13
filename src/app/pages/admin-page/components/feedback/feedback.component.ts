import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-feedback',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Feedback</h2>
      <p class="text-slate-600 dark:text-slate-400">Feedback management features will be implemented here.</p>
    </div>
  `
})
export class FeedbackComponent {
}
