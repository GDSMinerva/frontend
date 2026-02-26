import { Component, OnInit, signal, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SavedJobsService } from '../../../../services/saved-jobs.service';

// --- Interfaces ---

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  matchScore: number; // 0-100
  description: string;
  requirements: string[];
  postedDate: string;
  postedDaysAgo: number; // Numeric value used for Date Range filtering
  logoUrl?: string;
  companyWebsite?: string; // Official company website URL
  remoteType: 'remote' | 'on-site' | 'hybrid'; // Used for Remote Option filtering
}

interface JobFilter {
  searchQuery: string;
  location: string;
  jobType: JobTypeOption['value'][]; // Multi-select job types
  dateRange: DateRangeOption['value']; // Single-select date range
  remoteOption: RemoteOption['value']; // Single-select remote preference
  matchScoreMin: number;
}

interface UserCVStatus {
  hasSubmittedCV: boolean;
  lastScanDate?: string;
  cvId?: string;
}

// --- Filter Option Interfaces ---
// These drive the dropdown menus in the template — no hardcoding in HTML

export interface DateRangeOption {
  label: string;
  value: 'any' | 'day' | 'week' | 'month';
  maxDays: number | null; // null means no limit (any time)
}

export interface JobTypeOption {
  label: string;
  value: 'full-time' | 'part-time' | 'contract' | 'remote';
  icon: string; // material symbol name
}

export interface RemoteOption {
  label: string;
  value: 'any' | 'remote' | 'on-site' | 'hybrid';
  icon: string; // material symbol name
}

// --- Dropdown State Interface ---

interface DropdownState {
  dateRange: boolean;
  jobType: boolean;
  remoteOption: boolean;
}

@Component({
  selector: 'app-job-matching',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-matching.component.html',
  styleUrl: './job-matching.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class JobMatchingComponent implements OnInit {
  // CV Status
  userCVStatus = signal<UserCVStatus>({ hasSubmittedCV: false });

  // Job data (only loaded if CV submitted)
  jobs = signal<Job[]>([]);
  filteredJobs = signal<Job[]>([]);

  // Filters
  filters = signal<JobFilter>({
    searchQuery: '',
    location: '',
    jobType: [],
    dateRange: 'any',
    remoteOption: 'any',
    matchScoreMin: 0
  });

  // Sorting
  sortOrder = signal<'relevance' | 'date'>('relevance');

  // UI state
  isLoading = signal(false);
  selectedJob = signal<Job | null>(null);
  activeTab = signal<'overview' | 'company' | 'analysis'>('overview');

  // Dropdown open/close state
  dropdowns = signal<DropdownState>({
    dateRange: false,
    jobType: false,
    remoteOption: false
  });

  actionError = signal<string | null>(null);
  inputError = signal<string | null>(null);

  private clearErrorAfterDelay(): void {
    setTimeout(() => {
      this.actionError.set(null);
      this.inputError.set(null);
    }, 2000);
  }

  // --- Saved Jobs: delegated to shared service so Profile component stays in sync ---
  private savedJobsService = inject(SavedJobsService);

  // Expose saved state check to the template
  isJobSaved = (jobId: string) => this.savedJobsService.isJobSaved(jobId);

  // --- Filter Options Data ---
  // All dropdown options are defined here as typed arrays — the template just iterates them

  readonly dateRangeOptions: DateRangeOption[] = [
    { label: 'Any time',    value: 'any',   maxDays: null },
    { label: 'Past 24h',    value: 'day',   maxDays: 1    },
    { label: 'Past week',   value: 'week',  maxDays: 7    },
    { label: 'Past month',  value: 'month', maxDays: 30   }
  ];

  readonly jobTypeOptions: JobTypeOption[] = [
    { label: 'Full-time', value: 'full-time',  icon: 'work'          },
    { label: 'Part-time', value: 'part-time',  icon: 'schedule'      },
    { label: 'Contract',  value: 'contract',   icon: 'description'   },
    { label: 'Remote',    value: 'remote',     icon: 'wifi'          }
  ];

  readonly remoteOptions: RemoteOption[] = [
    { label: 'Any',       value: 'any',     icon: 'public'    },
    { label: 'Remote',    value: 'remote',  icon: 'home_work' },
    { label: 'On-site',   value: 'on-site', icon: 'business'  },
    { label: 'Hybrid',    value: 'hybrid',  icon: 'sync_alt'  }
  ];

  // --- Computed: active filter badge counts (used for button labels) ---

  get activeDateRangeLabel(): string {
    const opt = this.dateRangeOptions.find(o => o.value === this.filters().dateRange);
    return opt && opt.value !== 'any' ? opt.label : 'Date Range';
  }

  get activeJobTypeLabel(): string {
    const count = this.filters().jobType.length;
    return count > 0 ? `Job Type (${count})` : 'Job Type';
  }

  get activeRemoteLabel(): string {
    const opt = this.remoteOptions.find(o => o.value === this.filters().remoteOption);
    return opt && opt.value !== 'any' ? opt.label : 'Remote option';
  }

  get hasActiveFilters(): boolean {
    const f = this.filters();
    return (
      f.dateRange !== 'any' ||
      f.jobType.length > 0 ||
      f.remoteOption !== 'any' ||
      f.searchQuery.trim() !== '' ||
      f.location.trim() !== ''
    );
  }

  // --- Sample Jobs Data ---

  private readonly sampleJobs: Job[] = [
    {
      id: 'job-001',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120k - $160k',
      type: 'full-time',
      remoteType: 'hybrid',
      matchScore: 92,
      description: 'We are looking for a Senior Full Stack Developer to lead our core product development. You will be responsible for architecting and implementing new features, optimizing application performance, and mentoring junior developers.',
      requirements: ['React', 'TypeScript', '5+ years experience', 'Node.js', 'AWS'],
      postedDate: '2 days ago',
      postedDaysAgo: 2,
      logoUrl: 'https://ui-avatars.com/api/?name=TechCorp+Inc&background=random',
      companyWebsite: 'https://techcorp.example.com'
    },
    {
      id: 'job-002',
      title: 'Full Stack Engineer',
      company: 'StartupX',
      location: 'Remote',
      salary: '$100k - $140k',
      type: 'full-time',
      remoteType: 'remote',
      matchScore: 85,
      description: 'Join our fast-paced startup environment to build the next generation of fintech solutions.',
      requirements: ['Angular', 'NestJS', 'PostgreSQL', 'Docker'],
      postedDate: '5 days ago',
      postedDaysAgo: 5,
      logoUrl: 'https://ui-avatars.com/api/?name=StartupX&background=random',
      companyWebsite: 'https://startupx.example.com'
    },
    {
      id: 'job-003',
      title: 'UI/UX Designer & Developer',
      company: 'Creative Studio',
      location: 'New York, NY',
      salary: '$90k - $120k',
      type: 'contract',
      remoteType: 'on-site',
      matchScore: 78,
      description: 'We need a creative developer who can bridge the gap between design and engineering.',
      requirements: ['Figma', 'CSS/SCSS', 'JavaScript', 'Animation libraries'],
      postedDate: '1 week ago',
      postedDaysAgo: 7,
      logoUrl: 'https://ui-avatars.com/api/?name=Creative+Studio&background=random',
      companyWebsite: 'https://creativestudio.example.com'
    },
    {
      id: 'job-004',
      title: 'DevOps Engineer',
      company: 'CloudSystems',
      location: 'Austin, TX',
      salary: '$130k - $170k',
      type: 'full-time',
      remoteType: 'hybrid',
      matchScore: 65,
      description: 'Looking for an experienced DevOps engineer to manage our multi-cloud infrastructure.',
      requirements: ['Kubernetes', 'Terraform', 'CI/CD', 'Python'],
      postedDate: '3 days ago',
      postedDaysAgo: 3,
      logoUrl: 'https://ui-avatars.com/api/?name=CloudSystems&background=random',
      companyWebsite: 'https://cloudsystems.example.com'
    },
    {
      id: 'job-005',
      title: 'React Native Developer',
      company: 'MobileFirst Co.',
      location: 'Remote',
      salary: '$95k - $130k',
      type: 'remote',
      remoteType: 'remote',
      matchScore: 80,
      description: 'Build cross-platform mobile applications using React Native for our growing user base.',
      requirements: ['React Native', 'TypeScript', 'Redux', 'iOS/Android'],
      postedDate: '12 hours ago',
      postedDaysAgo: 0,
      logoUrl: 'https://ui-avatars.com/api/?name=MobileFirst&background=random',
      companyWebsite: 'https://mobilefirst.example.com'
    },
    {
      id: 'job-006',
      title: 'Backend Engineer (Part-time)',
      company: 'DataFlow Ltd.',
      location: 'London, UK',
      salary: '$60k - $80k',
      type: 'part-time',
      remoteType: 'hybrid',
      matchScore: 70,
      description: 'Maintain and extend our data pipeline infrastructure. Flexible hours, 20h/week.',
      requirements: ['Python', 'FastAPI', 'PostgreSQL', 'AWS Lambda'],
      postedDate: '20 days ago',
      postedDaysAgo: 20,
      logoUrl: 'https://ui-avatars.com/api/?name=DataFlow&background=random',
      companyWebsite: 'https://dataflow.example.com'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkCVStatus();
    // Close dropdowns when clicking outside
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  /**
   * Close all dropdowns when clicking outside the filter bar.
   * Called on global document click.
   */
  private onDocumentClick(event: MouseEvent): void {
    const filterBar = document.getElementById('filter-bar');
    if (filterBar && !filterBar.contains(event.target as Node)) {
      this.closeAllDropdowns();
    }
  }

  // --- Dropdown Controls ---

  /**
   * Toggle a specific dropdown open/closed.
   * Closes all other dropdowns before opening the requested one.
   */
  toggleDropdown(key: keyof DropdownState, event: MouseEvent): void {
    event.stopPropagation(); // prevent document click from immediately closing it
    const current = this.dropdowns();
    const isOpen = current[key];
    this.dropdowns.set({ dateRange: false, jobType: false, remoteOption: false });
    if (!isOpen) {
      this.dropdowns.update(d => ({ ...d, [key]: true }));
    }
  }

  closeAllDropdowns(): void {
    this.dropdowns.set({ dateRange: false, jobType: false, remoteOption: false });
  }

  // --- Filter Setters ---

  /**
   * Set the date range filter and immediately re-apply filters.
   * TODO: When API is integrated, pass this value as a query param (e.g. ?postedWithin=7)
   */
  setDateRange(value: DateRangeOption['value']): void {
    this.filters.update(f => ({ ...f, dateRange: value }));
    this.applyFilters();
    this.closeAllDropdowns();
  }

  /**
   * Toggle a job type in the multi-select filter and immediately re-apply.
   * TODO: When API is integrated, pass as repeated query param (e.g. ?type=full-time&type=contract)
   */
  toggleJobType(value: JobTypeOption['value']): void {
    this.filters.update(f => {
      const types = f.jobType.includes(value)
        ? f.jobType.filter(t => t !== value) // deselect
        : [...f.jobType, value];              // select
      return { ...f, jobType: types };
    });
    this.applyFilters();
    // Keep dropdown open for multi-select UX
  }

  /**
   * Set the remote option filter and immediately re-apply filters.
   * TODO: When API is integrated, pass as query param (e.g. ?remote=remote)
   */
  setRemoteOption(value: RemoteOption['value']): void {
    this.filters.update(f => ({ ...f, remoteOption: value }));
    this.applyFilters();
    this.closeAllDropdowns();
  }

  isJobTypeSelected(value: JobTypeOption['value']): boolean {
    return this.filters().jobType.includes(value);
  }

  // --- Core Filter Logic ---

  /**
   * Check if user has submitted a CV
   * This will determine which view to show
   */
  async checkCVStatus(): Promise<void> {
    this.isLoading.set(true);
    // TODO: Replace with actual API call
    // const status = await this.cvService.checkStatus();
    // this.userCVStatus.set(status);

    // Simulate API delay
    setTimeout(async () => {
      if (Math.random() < 0.1) {
        this.actionError.set('Failed to fetch CV status.');
        this.clearErrorAfterDelay();
        this.isLoading.set(false);
        return;
      }

      // For now, use sample data
      // Set hasSubmittedCV to false to see locked state, true to see job list
      this.userCVStatus.set({
        hasSubmittedCV: true, // Change this to test different states
        lastScanDate: '2024-01-15',
        cvId: 'cv-001'
      });

      if (this.userCVStatus().hasSubmittedCV) {
        await this.fetchJobs();
      }
      this.isLoading.set(false);
    }, 1000);
  }

  /**
   * Fetch job matches from API
   * Only called if user has submitted CV
   */
  async fetchJobs(): Promise<void> {
    // TODO: API integration
    // const jobs = await this.jobService.getMatches();
    // this.jobs.set(jobs);
    // this.applyFilters();

    // Sample data for testing
    this.jobs.set(this.sampleJobs);
    this.filteredJobs.set(this.sampleJobs);

    // Select the first job by default if available
    if (this.sampleJobs.length > 0) {
      this.selectedJob.set(this.sampleJobs[0]);
    }
  }

  navigateToDashboard(): void {
    this.router.navigate(['/user/dashboard']);
  }

  applyFilters(): void {
    const f = this.filters();
    let filtered = this.jobs().filter(job => {

      // --- Search query: matches title or company ---
      const matchesSearch =
        !f.searchQuery.trim() ||
        job.title.toLowerCase().includes(f.searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(f.searchQuery.toLowerCase());
        // --- Location: matches job location (case-insensitive, partial match) ---
        // TODO: When API is integrated, pass as query param (e.g. ?location=Tunis)
      const matchesLocation = 
      !f.location.trim() ||
      job.location.toLowerCase().includes(f.location.toLowerCase());

      // --- Date range: filter by postedDaysAgo ---
      const dateRangeOpt = this.dateRangeOptions.find(o => o.value === f.dateRange);
      const matchesDate =
        !dateRangeOpt?.maxDays || job.postedDaysAgo <= dateRangeOpt.maxDays;

      // --- Job Type: multi-select, OR logic (any selected type matches) ---
      const matchesJobType =
        f.jobType.length === 0 || f.jobType.includes(job.type);

      // --- Remote option: single-select ---
      const matchesRemote =
        f.remoteOption === 'any' || job.remoteType === f.remoteOption;

      return matchesSearch && matchesLocation && matchesDate && matchesJobType && matchesRemote;

    });

    // Apply sorting
    if (this.sortOrder() === 'relevance') {
      filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      // Sort by most recently posted (lowest postedDaysAgo first)
      // TODO: In a real app, sort by the actual ISO date string from the API
      filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    }

    this.filteredJobs.set(filtered);

    // If selected job is no longer in the filtered list, deselect it
    if (this.selectedJob() && !filtered.find(j => j.id === this.selectedJob()!.id)) {
      this.selectedJob.set(filtered[0] ?? null);
    }
  }

  clearFilters(): void {
    this.filters.set({
      searchQuery: '',
      location: '',
      jobType: [],
      dateRange: 'any',
      remoteOption: 'any',
      matchScoreMin: 0
    });
    this.applyFilters();
  }

  toggleSort(): void {
    const newOrder = this.sortOrder() === 'relevance' ? 'date' : 'relevance';
    this.sortOrder.set(newOrder);
    // Re-apply filters to trigger sort
    this.applyFilters();
  }

  selectJob(job: Job): void {
    this.selectedJob.set(job);
    // Reset tab to overview when switching jobs
    this.activeTab.set('overview');
  }

  applyToJob(jobId: string): void {
    if (Math.random() < 0.1) {
      this.actionError.set('External application service is down. Try again later.');
      this.clearErrorAfterDelay();
      return;
    }
    // Application logic
    console.log(`Applying to job ${jobId}`);
    alert(`Application submitted successfully for job #${jobId}!`);
  }

  /**
   * Toggles save/unsave via the shared SavedJobsService.
   * This syncs automatically with the Profile component's Saved Jobs list.
   */
  toggleBookmark(job: Job): void {
    if (this.isJobSaved(job.id)) {
      if (!confirm(`Remove "${job.title}" from your saved jobs?`)) {
        return;
      }
    }

    this.savedJobsService.toggleBookmark({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      type: job.type,
      matchScore: job.matchScore,
      logoUrl: job.logoUrl,
      companyWebsite: job.companyWebsite
    });
  }

  // Use type casting to handle the navigator.share API which might not be in the TS lib definition
  shareJob(job: Job): void {
    if ((navigator as any).share) {
      (navigator as any).share({
        title: job.title,
        text: `Check out this ${job.title} role at ${job.company}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback
      // In a real browser we would use Clipboard API
      console.log(`${job.title} at ${job.company} - Match Score: ${job.matchScore}%`);
      alert('Job details copied to clipboard!');
    }
  }

  scanProfile(): void {
    this.isLoading.set(true);
    this.actionError.set(null);

    if (Math.random() < 0.1) {
      setTimeout(() => {
        this.actionError.set('AI Analysis engine timeout. Try again.');
        this.clearErrorAfterDelay();
        this.isLoading.set(false);
      }, 1000);
      return;
    }

    setTimeout(() => {
      this.isLoading.set(false);
      alert('Profile re-scanned against this job description. Match score updated!');
    }, 1500);
  }

  setActiveTab(tab: 'overview' | 'company' | 'analysis'): void {
    this.activeTab.set(tab);
  }

  // Helper for template
  getMatchClass(score: number): string {
    if (score >= 80) return 'match-high';
    if (score >= 60) return 'match-medium';
    return 'match-low';
  }
  clearJobTypeFilter(event: MouseEvent): void {
    event.stopPropagation();
    this.filters.update(f => ({ ...f, jobType: [] }));
    this.applyFilters();
  }
/**
 * Update the location filter from the input event.
 * TODO: When API is integrated, pass as query param (e.g. ?location=Tunis)
 */
  setLocation(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filters.update(f => ({ ...f, location: value }));
    this.applyFilters();
  }

  setSearchQuery(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filters.update(f => ({ ...f, searchQuery: value }));
    this.applyFilters();
}
}