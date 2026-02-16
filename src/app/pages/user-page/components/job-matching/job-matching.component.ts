import { Component, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  logoUrl?: string;
}

interface JobFilter {
  searchQuery: string;
  location: string;
  jobType: string[];
  salaryRange: { min: number; max: number };
  matchScoreMin: number;
}

interface UserCVStatus {
  hasSubmittedCV: boolean;
  lastScanDate?: string;
  cvId?: string;
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
  savedJobs = signal<Set<string>>(new Set());
  
  // Filters
  filters = signal<JobFilter>({
    searchQuery: '',
    location: '',
    jobType: [],
    salaryRange: { min: 0, max: 200000 },
    matchScoreMin: 0
  });

  // Sorting
  sortOrder = signal<'relevance' | 'date'>('relevance');
  
  // UI state
  isLoading = signal(false);
  selectedJob = signal<Job | null>(null);
  activeTab = signal<'overview' | 'company' | 'analysis'>('overview');

  private readonly sampleJobs: Job[] = [
    {
      id: 'job-001',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120k - $160k',
      type: 'full-time',
      matchScore: 92,
      description: 'We are looking for a Senior Full Stack Developer to lead our core product development. You will be responsible for architecting and implementing new features, optimizing application performance, and mentoring junior developers.',
      requirements: ['React', 'TypeScript', '5+ years experience', 'Node.js', 'AWS'],
      postedDate: '2 days ago',
      logoUrl: 'https://ui-avatars.com/api/?name=TechCorp+Inc&background=random'
    },
    {
      id: 'job-002',
      title: 'Full Stack Engineer',
      company: 'StartupX',
      location: 'Remote',
      salary: '$100k - $140k',
      type: 'full-time',
      matchScore: 85,
      description: 'Join our fast-paced startup environment to build the next generation of fintech solutions.',
      requirements: ['Angular', 'NestJS', 'PostgreSQL', 'Docker'],
      postedDate: '5 days ago',
      logoUrl: 'https://ui-avatars.com/api/?name=StartupX&background=random'
    },
    {
      id: 'job-003',
      title: 'UI/UX Designer & Developer',
      company: 'Creative Studio',
      location: 'New York, NY',
      salary: '$90k - $120k',
      type: 'contract',
      matchScore: 78,
      description: 'We need a creative developer who can bridge the gap between design and engineering.',
      requirements: ['Figma', 'CSS/SCSS', 'JavaScript', 'Animation libraries'],
      postedDate: '1 week ago',
      logoUrl: 'https://ui-avatars.com/api/?name=Creative+Studio&background=random'
    },
    {
      id: 'job-004',
      title: 'DevOps Engineer',
      company: 'CloudSystems',
      location: 'Austin, TX',
      salary: '$130k - $170k',
      type: 'full-time',
      matchScore: 65,
      description: 'Looking for an experienced DevOps engineer to manage our multi-cloud infrastructure.',
      requirements: ['Kubernetes', 'Terraform', 'CI/CD', 'Python'],
      postedDate: '3 days ago',
      logoUrl: 'https://ui-avatars.com/api/?name=CloudSystems&background=random'
    }
  ];
  
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkCVStatus();
  }
  
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
    const currentFilters = this.filters();
    let filtered = this.jobs().filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(currentFilters.searchQuery.toLowerCase()) || 
                            job.company.toLowerCase().includes(currentFilters.searchQuery.toLowerCase());
      return matchesSearch;
    });

    // Apply sorting
    if (this.sortOrder() === 'relevance') {
      filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else {
      // parsing "2 days ago" is tricky without a real date object, so simplified for demo
      // In a real app, we would parse job.postedDate
      filtered.reverse(); 
    }

    this.filteredJobs.set(filtered);
  }

  clearFilters(): void {
      this.filters.set({
        searchQuery: '',
        location: '',
        jobType: [],
        salaryRange: { min: 0, max: 200000 },
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
    // Application logic
    console.log(`Applying to job ${jobId}`);
    alert(`Application submitted successfully for job #${jobId}!`);
  }

  toggleBookmark(jobId: string): void {
    const currentSaved = new Set(this.savedJobs());
    if (currentSaved.has(jobId)) {
        currentSaved.delete(jobId);
    } else {
        currentSaved.add(jobId);
    }
    this.savedJobs.set(currentSaved);
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

  isJobSaved(jobId: string): boolean {
      return this.savedJobs().has(jobId);
  }
}
