import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-training-catalog',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-4">Training Catalog</h2>
      <p class="text-slate-600 dark:text-slate-400">Training catalog features will be implemented here.</p>
    </div>
  `
})
export class TrainingCatalogComponent {
}
