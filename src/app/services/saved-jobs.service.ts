import { Injectable, signal, computed } from '@angular/core';

export interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  matchScore: number;
  logoUrl?: string;
  companyWebsite?: string; // Company website link
  savedDate: string;
  isImportant: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SavedJobsService {
  // Core saved jobs signal
  private _savedJobs = signal<SavedJob[]>([]);

  // Public read-only access
  savedJobs = this._savedJobs.asReadonly();

  // Computed: IDs only — used for quick lookup in job-matching
  savedJobIds = computed(() => new Set(this._savedJobs().map(j => j.id)));

  isJobSaved(jobId: string): boolean {
    return this.savedJobIds().has(jobId);
  }

  saveJob(job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    type: string;
    matchScore: number;
    logoUrl?: string;
    companyWebsite?: string;
  }): void {
    if (this.isJobSaved(job.id)) return;
    const saved: SavedJob = {
      ...job,
      savedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isImportant: false
    };
    this._savedJobs.update(jobs => [saved, ...jobs]);
  }

  unsaveJob(jobId: string): void {
    this._savedJobs.update(jobs => jobs.filter(j => j.id !== jobId));
  }

  toggleBookmark(job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    type: string;
    matchScore: number;
    logoUrl?: string;
    companyWebsite?: string;
  }): void {
    if (this.isJobSaved(job.id)) {
      this.unsaveJob(job.id);
    } else {
      this.saveJob(job);
    }
  }

  toggleImportant(jobId: string): void {
    this._savedJobs.update(jobs =>
      jobs.map(j => j.id === jobId ? { ...j, isImportant: !j.isImportant } : j)
    );
  }
}
