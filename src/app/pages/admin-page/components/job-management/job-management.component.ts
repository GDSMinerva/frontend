import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Data Interfaces
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  datePosted: string;
  status: 'active' | 'pending' | 'expired';
  selected?: boolean;
}

interface FilterOptions {
  searchQuery: string;
  company: string;
  location: string;
  status: string;
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
  changeType: 'positive' | 'neutral' | 'warning';
  icon: string;
  iconColor: string;
  badgeColor: string;
}

@Component({
  selector: 'app-job-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-management.component.html',
  styleUrls: ['./job-management.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class JobManagementComponent {
  // Expose Math to template
  Math = Math;

  // Stat Cards Data
  statCards: StatCard[] = [
    {
      id: 'total-listings',
      label: 'Total Listings',
      value: '1,284',
      change: '+12% vs last week',
      changeType: 'positive',
      icon: 'list_alt',
      iconColor: 'blue',
      badgeColor: 'cyan'
    },
    {
      id: 'pending-validation',
      label: 'Pending Validation',
      value: '42',
      change: 'Needs Review',
      changeType: 'warning',
      icon: 'pending_actions',
      iconColor: 'amber',
      badgeColor: 'amber'
    },
    {
      id: 'active-offers',
      label: 'Active Offers',
      value: '916',
      change: 'Live Now',
      changeType: 'positive',
      icon: 'check_circle',
      iconColor: 'cyan',
      badgeColor: 'violet'
    }
  ];

  // Job Data Array (matching Stitch template data)
  jobs: Job[] = [
    { id: 'JOB-8821', title: 'Senior Software Engineer', company: 'TechCorp Solutions', location: 'Remote', datePosted: 'Oct 24, 2023', status: 'active' },
    { id: 'JOB-8822', title: 'Product Designer (UX/UI)', company: 'CreativeFlow Studio', location: 'San Francisco, CA', datePosted: 'Oct 25, 2023', status: 'pending' },
    { id: 'JOB-8823', title: 'Backend Developer (Node.js)', company: 'Systemic Ltd', location: 'Austin, TX', datePosted: 'Oct 22, 2023', status: 'active' },
    { id: 'JOB-8824', title: 'Data Scientist', company: 'InnoAnalytics', location: 'New York, NY', datePosted: 'Oct 15, 2023', status: 'expired' },
    { id: 'JOB-8825', title: 'Marketing Specialist', company: 'Global Reach', location: 'London, UK', datePosted: 'Oct 26, 2023', status: 'pending' },
    { id: 'JOB-8826', title: 'DevOps Engineer', company: 'CloudTech Inc', location: 'Remote', datePosted: 'Oct 20, 2023', status: 'active' },
    { id: 'JOB-8827', title: 'Frontend Developer', company: 'WebCraft Studios', location: 'Berlin, Germany', datePosted: 'Oct 18, 2023', status: 'active' },
    { id: 'JOB-8828', title: 'AI/ML Engineer', company: 'DataMind Corp', location: 'Boston, MA', datePosted: 'Oct 12, 2023', status: 'expired' },
    { id: 'JOB-8829', title: 'Product Manager', company: 'InnovateTech', location: 'Seattle, WA', datePosted: 'Oct 27, 2023', status: 'pending' },
    { id: 'JOB-8830', title: 'Full Stack Developer', company: 'CodeFactory', location: 'Toronto, Canada', datePosted: 'Oct 23, 2023', status: 'active' }
  ];

  // Filtered and paginated jobs
  filteredJobs: Job[] = [];
  displayedJobs: Job[] = [];

  // Filter Options
  filters: FilterOptions = {
    searchQuery: '',
    company: '',
    location: '',
    status: ''
  };

  // Pagination State
  pagination: PaginationState = {
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
    totalPages: 1
  };

  // Bulk selection
  selectAll: boolean = false;

  constructor() {
    this.applyFilters();
  }

  // CRUD Operations

  /**
   * Add a new job to the jobs array
   */
  addJob(job: Job): void {
    this.jobs.unshift(job);
    this.applyFilters();
    console.log('Job added:', job);
  }

  /**
   * Update an existing job by ID
   */
  updateJob(jobId: string, updatedData: Partial<Job>): void {
    const index = this.jobs.findIndex(j => j.id === jobId);
    if (index !== -1) {
      this.jobs[index] = { ...this.jobs[index], ...updatedData };
      this.applyFilters();
      console.log('Job updated:', this.jobs[index]);
    }
  }

  /**
   * Delete a job by ID
   */
  deleteJob(jobId: string): void {
    const index = this.jobs.findIndex(j => j.id === jobId);
    if (index !== -1) {
      const deletedJob = this.jobs.splice(index, 1)[0];
      this.applyFilters();
      console.log('Job deleted:', deletedJob);
    }
  }

  /**
   * Get a job by ID
   */
  getJobById(jobId: string): Job | undefined {
    return this.jobs.find(j => j.id === jobId);
  }

  /**
   * Validate/Activate a job
   */
  validateJob(jobId: string): void {
    const job = this.getJobById(jobId);
    if (job && job.status !== 'active') {
      job.status = 'active';
      this.applyFilters();
      console.log('Job validated:', job);
    }
  }

  // Filtering & Search

  /**
   * Apply all active filters and update displayed jobs
   */
  applyFilters(): void {
    let result = [...this.jobs];

    // Search filter (title, company, or ID)
    if (this.filters.searchQuery.trim()) {
      const query = this.filters.searchQuery.toLowerCase();
      result = result.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.id.toLowerCase().includes(query)
      );
    }

    // Company filter
    if (this.filters.company) {
      result = result.filter(job => job.company === this.filters.company);
    }

    // Location filter
    if (this.filters.location) {
      result = result.filter(job => job.location === this.filters.location);
    }

    // Status filter
    if (this.filters.status) {
      result = result.filter(job => job.status === this.filters.status);
    }

    this.filteredJobs = result;
    this.updatePagination();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {
      searchQuery: '',
      company: '',
      location: '',
      status: ''
    };
    this.applyFilters();
  }

  // Pagination

  /**
   * Update pagination state and displayed jobs
   */
  updatePagination(): void {
    this.pagination.totalItems = this.filteredJobs.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);

    // Ensure current page is valid
    if (this.pagination.currentPage > this.pagination.totalPages) {
      this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
    }

    // Calculate displayed jobs
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const endIndex = startIndex + this.pagination.itemsPerPage;
    this.displayedJobs = this.filteredJobs.slice(startIndex, endIndex);
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
   * Get status badge color class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-violet-500/10 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20';
      case 'pending':
        return 'bg-amber-500/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-200 dark:border-amber-500/20';
      case 'expired':
        return 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10';
      default:
        return 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10';
    }
  }

  /**
   * Get unique companies for filter dropdown
   */
  getUniqueCompanies(): string[] {
    return [...new Set(this.jobs.map(job => job.company))];
  }

  /**
   * Get unique locations for filter dropdown
   */
  getUniqueLocations(): string[] {
    return [...new Set(this.jobs.map(job => job.location))];
  }

  /**
   * Handle "Import Job Offers" button click
   */
  onImportJobs(): void {
    console.log('Import Job Offers clicked - would open file picker');
  }

  /**
   * Handle "Add New Job" button click
   */
  onAddNewJob(): void {
    console.log('Add New Job clicked - would open modal');

    const newJob: Job = {
      id: `JOB-${Math.floor(Math.random() * 10000)}`,
      title: 'New Job Position',
      company: 'New Company',
      location: 'Remote',
      datePosted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'pending'
    };

    this.addJob(newJob);
  }
}
