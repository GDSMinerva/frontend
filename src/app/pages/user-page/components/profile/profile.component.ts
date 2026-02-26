import { Component, signal, CUSTOM_ELEMENTS_SCHEMA, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService, UserProfile } from '../../../../services/profile.service';
import { SavedJobsService } from '../../../../services/saved-jobs.service';

// --- Interfaces ---

export interface Skill {
  id: string;
  name: string;
  category: 'hard' | 'soft';
  level?: number; // 1-100 for proficiency
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string; // null or undefined if current
  description?: string;
  isCurrent: boolean;
}

export interface CV {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  fileSize: string;
  isActive: boolean; // Primary CV
  score?: number; // Added from HTML maquette
  versionName?: string; // Added from HTML maquette
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfileComponent {
  private profileService = inject(ProfileService);
  userProfile = this.profileService.userProfile$;

  // --- Saved Jobs: injected from shared service, syncs with Job Matching component ---
  private savedJobsService = inject(SavedJobsService);

  // Raw signal from service
  savedJobs = this.savedJobsService.savedJobs;

  // --- Saved Jobs Pagination & Sort ---

  /** Number of saved job cards shown per page */
  readonly JOBS_PER_PAGE = 4;

  /** Current sort mode for the saved jobs list */
  savedJobsSort = signal<'important-first' | 'recent-first'>('important-first');

  /** Current page number (1-based) */
  savedJobsPage = signal(1);

  /**
   * Sorted version of all saved jobs.
   * 'important-first': important jobs float to top, then by savedDate desc.
   * 'recent-first': all jobs sorted by savedDate desc regardless of importance.
   */
  sortedSavedJobs = computed(() => {
    const jobs = [...this.savedJobs()];
    if (this.savedJobsSort() === 'important-first') {
      return jobs.sort((a, b) => {
        if (a.isImportant === b.isImportant) return 0;
        return a.isImportant ? -1 : 1; // important first
      });
    }
    // recent-first: already in insertion order (most recent saved last in service)
    // reverse so newest appears first
    return jobs.reverse();
  });

  /** Total number of pages needed */
  totalPages = computed(() =>
    Math.ceil(this.sortedSavedJobs().length / this.JOBS_PER_PAGE)
  );

  /**
   * The slice of jobs to display on the current page.
   * Auto-resets to page 1 if current page exceeds total after sort/unsave.
   */
  paginatedSavedJobs = computed(() => {
    const page = Math.min(this.savedJobsPage(), this.totalPages() || 1);
    const start = (page - 1) * this.JOBS_PER_PAGE;
    return this.sortedSavedJobs().slice(start, start + this.JOBS_PER_PAGE);
  });

  /**
   * Array of page numbers to render in the pagination bar.
   * Shows up to 5 page numbers centered on the current page.
   */
  pageNumbers = computed(() => {
    const total = this.totalPages();
    if (total <= 1) return [];
    const current = this.savedJobsPage();
    const window = 2; // pages on each side of current
    const start = Math.max(1, current - window);
    const end = Math.min(total, current + window);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  // Computed helpers for section grouping (Important / Other) on current page
  hasImportantJobs = computed(() => this.paginatedSavedJobs().some(j => j.isImportant));
  hasOtherJobs = computed(() => this.paginatedSavedJobs().some(j => !j.isImportant));

  // --- State Signals ---

  // Skills data
  hardSkills = signal<Skill[]>([]);
  softSkills = signal<Skill[]>([]);

  // Experience data
  experiences = signal<Experience[]>([]);

  // CV management
  cvList = signal<CV[]>([]);

  // UI state
  isEditingProfile = signal(false);
  isUploadingCV = signal(false);
  isLoading = signal(false);
  actionError = signal<string | null>(null);

  private clearErrorAfterDelay(): void {
    setTimeout(() => this.actionError.set(null), 2000);
  }

  // Forms
  profileForm: FormGroup;

  // --- Sample Data (Hardcoded for now) ---

  private readonly sampleHardSkills: Skill[] = [
    { id: 'hs-001', name: 'React', category: 'hard', level: 90 },
    { id: 'hs-002', name: 'TypeScript', category: 'hard', level: 85 },
    { id: 'hs-003', name: 'Tailwind CSS', category: 'hard', level: 95 },
    { id: 'hs-004', name: 'Node.js', category: 'hard', level: 80 },
    { id: 'hs-005', name: 'Next.js', category: 'hard', level: 85 },
  ];

  private readonly sampleSoftSkills: Skill[] = [
    { id: 'ss-001', name: 'Team Leadership', category: 'soft', level: 85 },
    { id: 'ss-002', name: 'Public Speaking', category: 'soft', level: 80 },
    { id: 'ss-003', name: 'Agile Methodology', category: 'soft', level: 90 },
  ];

  private readonly sampleExperiences: Experience[] = [
    {
      id: 'exp-001',
      company: 'TechCorp Inc.',
      position: 'Senior Frontend Developer',
      startDate: '2022-03',
      isCurrent: true,
      description: 'Leading the frontend migration to Angular 17. Improved performance by 40%.'
    },
    {
      id: 'exp-002',
      company: 'WebSolutions',
      position: 'Frontend Developer',
      startDate: '2020-01',
      endDate: '2022-02',
      isCurrent: false,
      description: 'Developed responsive web applications for various clients using React and Vue.'
    }
  ];

  private readonly sampleCVs: CV[] = [
    {
      id: 'cv-001',
      versionName: 'Software_Engineer_V3',
      fileName: 'Alex_Johnson_SE_V3.pdf',
      fileUrl: '/assets/cvs/resume.pdf',
      uploadDate: 'Oct 24, 2023',
      fileSize: '245 KB',
      isActive: true,
      score: 75
    },
    {
      id: 'cv-002',
      versionName: 'Frontend_Dev_Google',
      fileName: 'Alex_Johnson_FE_Google.pdf',
      fileUrl: '/assets/cvs/resume_fe.pdf',
      uploadDate: 'Oct 12, 2023',
      fileSize: '230 KB',
      isActive: false,
      score: 62
    },
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      location: [''],
      bio: ['']
    });

    // Initialize with sample data
    this.loadSampleData();
  }

  private loadSampleData(): void {
    this.hardSkills.set(this.sampleHardSkills);
    this.softSkills.set(this.sampleSoftSkills);
    this.experiences.set(this.sampleExperiences);
    this.cvList.set(this.sampleCVs);

    // Initialize form with data
    if (this.userProfile()) {
      this.profileForm.patchValue({
        firstName: this.userProfile()?.firstName,
        lastName: this.userProfile()?.lastName,
        email: this.userProfile()?.email,
        location: this.userProfile()?.location,
        bio: this.userProfile()?.bio
      });
    }
  }

  // --- Methods ---

  toggleEditMode(): void {
    if (this.isEditingProfile()) {
      // Cancel edit - reset form
      const profile = this.userProfile();
      if (profile) {
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          location: profile.location,
          bio: profile.bio
        });
      }
      this.isEditingProfile.set(false);
    } else {
      this.isEditingProfile.set(true);
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading.set(true);
      this.actionError.set(null);

      // Simulated failure
      if (Math.random() < 0.1) {
        setTimeout(() => {
          this.actionError.set('Connection lost. Profile changes not saved.');
          this.clearErrorAfterDelay();
          this.isLoading.set(false);
        }, 800);
        return;
      }

      // Simulate API call
      setTimeout(() => {
        const formValues = this.profileForm.value;
        this.profileService.setUserProfile(formValues);
        this.isEditingProfile.set(false);
        this.isLoading.set(false);
      }, 1000);
    }
  }

  deleteSkill(skill: Skill): void {
    if (confirm(`Remove "${skill.name}" from your skills? This may affect your job match scores.`)) {
      this.hardSkills.update(skills => skills.filter(s => s.id !== skill.id));
      this.softSkills.update(skills => skills.filter(s => s.id !== skill.id));
    }
  }

  // --- Saved Jobs Methods ---

  unsaveJob(jobId: string): void {
    const job = this.savedJobs().find(j => j.id === jobId);
    if (!job || !confirm(`Remove "${job.title}" from your saved jobs?`)) {
      return;
    }

    this.savedJobsService.unsaveJob(jobId);
    // After unsaving, snap back to page 1 if current page is now out of range
    if (this.savedJobsPage() > this.totalPages()) {
      this.savedJobsPage.set(Math.max(1, this.totalPages()));
    }
  }

  toggleImportant(jobId: string): void {
    this.savedJobsService.toggleImportant(jobId);
    // TODO: Call API to persist importance flag
  }

  /**
   * Toggle sort between 'important-first' and 'recent-first'.
   * Resets to page 1 so the user always sees the top of the re-sorted list.
   */
  toggleSavedJobsSort(): void {
    this.savedJobsSort.update(s => s === 'important-first' ? 'recent-first' : 'important-first');
    this.savedJobsPage.set(1); // always reset to page 1 after re-sorting
  }

  /** Navigate to a specific page number */
  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this.savedJobsPage.set(clamped);
  }

  // Helper for template: returns Tailwind color class based on match score
  getMatchColor(score: number): string {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-slate-400';
  }
  // Helper for template: returns CSS class for match score badge (mirrors job-matching component)
  getMatchClass(score: number): string {
    if (score >= 80) return 'match-high';
    if (score >= 60) return 'match-medium';
    return 'match-low';
  }

  // --- CV Management Methods ---

  setPrimaryCV(cvId: string): void {
    this.cvList.update(cvs => cvs.map(cv => ({
      ...cv,
      isActive: cv.id === cvId
    })));
    // TODO: Call API to set active CV
  }

  deleteCV(cvId: string): void {
    const cv = this.cvList().find(c => c.id === cvId);
    if (cv && confirm(`Permanently delete "${cv.versionName || cv.fileName}"? This action cannot be undone.`)) {
      this.cvList.update(cvs => cvs.filter(cv => cv.id !== cvId));
      // TODO: Call API to delete CV
    }
  }

  triggerFileUpload(): void {
    const fileInput = document.getElementById('cv-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadCV(file);
    }
  }

  async uploadCV(file: File): Promise<void> {
    this.isLoading.set(true);
    this.actionError.set(null);

    // Simulated failure
    if (Math.random() < 0.1) {
      setTimeout(() => {
        this.actionError.set('Virus scan failed for this file. Please try another.');
        this.clearErrorAfterDelay();
        this.isLoading.set(false);
      }, 1200);
      return;
    }

    // Simulate upload
    setTimeout(() => {
      const newCV: CV = {
        id: `cv-${Date.now()}`,
        versionName: file.name.split('.')[0],
        fileName: file.name,
        fileUrl: '#',
        uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        isActive: false,
        score: 0 // Waiting for analysis
      };

      this.cvList.update(cvs => [newCV, ...cvs]);
      this.isLoading.set(false);
    }, 1500);
  }

  downloadCV(cv: CV): void {
    // In a real app this would trigger a file download from URL
    // For demo purposes, we'll alert
    alert(`Downloading ${cv.fileName}...`);
    // const link = document.createElement('a');
    // link.href = cv.fileUrl;
    // link.download = cv.fileName;
    // link.click();
  }

  // --- Todos: API Integration Methods ---

  /*
  async fetchUserProfile(): Promise<void> {
    // this.userProfile.set(await this.userService.getProfile());
  }

  async fetchSkills(): Promise<void> {
    // const skills = await this.userService.getSkills();
    // this.hardSkills.set(skills.filter(s => s.category === 'hard'));
    // this.softSkills.set(skills.filter(s => s.category === 'soft'));
  }

  async updateProfile(data: Partial<UserProfile>): Promise<void> {
    // await this.userService.updateProfile(data);
  }
  */

  // --- Additional Methods ---

  triggerAvatarUpload(): void {
    const fileInput = document.getElementById('avatar-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      // Create a fake local URL for the image
      const reader = new FileReader();
      reader.onload = (e) => {
        const newAvatarUrl = e.target?.result as string;
        this.profileService.updateAvatar(newAvatarUrl);
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar(): void {
    if (confirm('Remove your profile picture? This will revert to a default placeholder.')) {
      const defaultAvatar = 'assets/images/default-avatar.png'; // Or generate from name
      this.profileService.updateAvatar(defaultAvatar);
    }
  }

  exportData(format: 'pdf' | 'zip' | 'json'): void {
    this.isLoading.set(true);
    this.actionError.set(null);

    if (Math.random() < 0.1) {
      setTimeout(() => {
        this.actionError.set('Export service timeout. Please try again.');
        this.clearErrorAfterDelay();
        this.isLoading.set(false);
      }, 1000);
      return;
    }

    // Simulate export delay
    setTimeout(() => {
      this.isLoading.set(false);
      alert(`Your data has been exported as ${format.toUpperCase()}. Check your downloads folder.`);
    }, 1500);
  }

  deleteAccount(): void {
    if (confirm('WARNING: This action cannot be undone. Are you sure you want to permanently delete your account and all associated data?')) {
      this.isLoading.set(true);
      this.actionError.set(null);

      // Simulated failure
      if (Math.random() < 0.1) {
        setTimeout(() => {
          this.actionError.set('Deletion failed: User session mismatch. Re-authenticate and try again.');
          this.clearErrorAfterDelay();
          this.isLoading.set(false);
        }, 1500);
        return;
      }

      setTimeout(() => {
        this.isLoading.set(false);
        this.router.navigate(['/sign-up']);
      }, 2000);
    }
  }
}