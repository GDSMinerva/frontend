import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Data Interfaces
interface TrainingResource {
  id: string;
  title: string;
  category: string;
  source: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  selected?: boolean;
}

interface FilterOptions {
  searchQuery: string;
  category: string;
  source: string;
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

interface StatCard {
  id: string;
  label: string;
  value: string;
  change: string;
  icon: string;
  iconColor: string;
  badgeColor: string;
}

@Component({
  selector: 'app-training-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './training-catalog.component.html',
  styleUrls: ['./training-catalog.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TrainingCatalogComponent {
  // Expose Math to template
  Math = Math;

  // Stat Cards Data
  statCards: StatCard[] = [
    {
      id: 'total-courses',
      label: 'Total Courses',
      value: '1,284',
      change: '+12% this month',
      icon: 'library_books',
      iconColor: 'purple',
      badgeColor: 'cyan'
    },
    {
      id: 'partner-platforms',
      label: 'Partner Platforms',
      value: 'Coursera, Udemy, edX',
      change: '8 active',
      icon: 'hub',
      iconColor: 'cyan',
      badgeColor: 'slate'
    },
    {
      id: 'enrollment-rate',
      label: 'Enrollment Rate',
      value: '68.2%',
      change: '+5.4%',
      icon: 'trending_up',
      iconColor: 'gradient',
      badgeColor: 'cyan'
    }
  ];

  // Training Resources Data Array
  resources: TrainingResource[] = [
    { id: 'TR-8821', title: 'Python for Everybody', category: 'Data Science', source: 'Coursera', difficulty: 'beginner' },
    { id: 'TR-8822', title: 'Advanced React Patterns', category: 'Software Engineering', source: 'Udemy', difficulty: 'advanced' },
    { id: 'TR-8823', title: 'UX Research Fundamentals', category: 'UI/UX Design', source: 'LinkedIn Learning', difficulty: 'intermediate' },
    { id: 'TR-8824', title: 'Machine Learning with Go', category: 'Data Science', source: 'Coursera', difficulty: 'advanced' },
    { id: 'TR-8825', title: 'TypeScript Masterclass', category: 'Software Engineering', source: 'Udemy', difficulty: 'intermediate' },
    { id: 'TR-8826', title: 'Product Design Thinking', category: 'UI/UX Design', source: 'edX', difficulty: 'beginner' },
    { id: 'TR-8827', title: 'Data Visualization with D3', category: 'Data Science', source: 'Coursera', difficulty: 'intermediate' },
    { id: 'TR-8828', title: 'Cloud Architecture AWS', category: 'Software Engineering', source: 'LinkedIn Learning', difficulty: 'advanced' },
    { id: 'TR-8829', title: 'Figma for Beginners', category: 'UI/UX Design', source: 'Udemy', difficulty: 'beginner' },
    { id: 'TR-8830', title: 'Deep Learning Specialization', category: 'Data Science', source: 'Coursera', difficulty: 'advanced' }
  ];

  // Filtered and paginated resources
  filteredResources: TrainingResource[] = [];
  displayedResources: TrainingResource[] = [];

  // Filter Options
  filters: FilterOptions = {
    searchQuery: '',
    category: '',
    source: ''
  };

  // Pagination State
  pagination: PaginationState = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1
  };

  constructor() {
    this.applyFilters();
  }

  // CRUD Operations

  /**
   * Add a new training resource
   */
  addResource(resource: TrainingResource): void {
    this.resources.unshift(resource);
    this.applyFilters();
    console.log('Resource added:', resource);
  }

  /**
   * Update an existing resource by ID
   */
  updateResource(resourceId: string, updatedData: Partial<TrainingResource>): void {
    const index = this.resources.findIndex(r => r.id === resourceId);
    if (index !== -1) {
      this.resources[index] = { ...this.resources[index], ...updatedData };
      this.applyFilters();
      console.log('Resource updated:', this.resources[index]);
    }
  }

  /**
   * Delete a resource by ID
   */
  deleteResource(resourceId: string): void {
    const index = this.resources.findIndex(r => r.id === resourceId);
    if (index !== -1) {
      const deletedResource = this.resources.splice(index, 1)[0];
      this.applyFilters();
      console.log('Resource deleted:', deletedResource);
    }
  }

  /**
   * Get a resource by ID
   */
  getResourceById(resourceId: string): TrainingResource | undefined {
    return this.resources.find(r => r.id === resourceId);
  }

  // Filtering & Search

  /**
   * Apply all active filters and update displayed resources
   */
  applyFilters(): void {
    let result = [...this.resources];

    // Search filter (title, category, or ID)
    if (this.filters.searchQuery.trim()) {
      const query = this.filters.searchQuery.toLowerCase();
      result = result.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.category.toLowerCase().includes(query) ||
        resource.id.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (this.filters.category) {
      result = result.filter(resource => resource.category === this.filters.category);
    }

    // Source filter
    if (this.filters.source) {
      result = result.filter(resource => resource.source === this.filters.source);
    }

    this.filteredResources = result;
    this.updatePagination();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {
      searchQuery: '',
      category: '',
      source: ''
    };
    this.applyFilters();
  }

  // Pagination

  /**
   * Update pagination state and displayed resources
   */
  updatePagination(): void {
    this.pagination.totalItems = this.filteredResources.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);

    // Ensure current page is valid
    if (this.pagination.currentPage > this.pagination.totalPages) {
      this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
    }

    // Calculate displayed resources
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const endIndex = startIndex + this.pagination.itemsPerPage;
    this.displayedResources = this.filteredResources.slice(startIndex, endIndex);
  }

  /**
   * Change to a specific page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Get array of page numbers for pagination controls
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.currentPage;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push(-1);

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push(-1);
      pages.push(totalPages);
    }

    return pages;
  }

  // UI Helpers

  /**
   * Get category badge color class
   */
  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'Data Science':
        return 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20';
      case 'Software Engineering':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'UI/UX Design':
        return 'bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-500/20';
      case 'Business':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      default:
        return 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/20';
    }
  }

  /**
   * Get difficulty level (1-3 bars filled)
   */
  getDifficultyBars(difficulty: string): number {
    switch (difficulty) {
      case 'beginner': return 1;
      case 'intermediate': return 2;
      case 'advanced': return 3;
      default: return 1;
    }
  }

  /**
   * Get unique categories for filter dropdown
   */
  getUniqueCategories(): string[] {
    return [...new Set(this.resources.map(resource => resource.category))];
  }

  /**
   * Get unique sources for filter dropdown
   */
  getUniqueSources(): string[] {
    return [...new Set(this.resources.map(resource => resource.source))];
  }

  /**
   * Handle "Add New Resource" button click
   */
  onAddNewResource(): void {
    console.log('Add New Resource clicked - would open modal');

    const newResource: TrainingResource = {
      id: `TR-${Math.floor(Math.random() * 10000)}`,
      title: 'New Training Course',
      category: 'Data Science',
      source: 'Coursera',
      difficulty: 'beginner'
    };

    this.addResource(newResource);
  }
}
