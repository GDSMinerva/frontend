import { Injectable, signal, computed } from '@angular/core';

export interface CVScanStatus {
  hasCompletedScan: boolean;
  cvId?: string;
  targetRole?: string;
  matchPercentage?: number;
  lastScanDate?: string;
  fileName?: string;
  fileSize?: string;
  versionName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CvScanService {
  // Global signal for CV scan status
  private status = signal<CVScanStatus>({
    hasCompletedScan: false
  });

  // Public readonly computed signal
  cvStatus = computed(() => this.status());

  constructor() {
    // Try to load from localStorage if possible
    const saved = localStorage.getItem('cv_scan_status');
    if (saved) {
      try {
        this.status.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cv_scan_status', e);
      }
    }
  }

  setScanStatus(status: CVScanStatus): void {
    this.status.set(status);
    localStorage.setItem('cv_scan_status', JSON.stringify(status));
  }

  resetStatus(): void {
    const emptyStatus = { hasCompletedScan: false };
    this.status.set(emptyStatus);
    localStorage.removeItem('cv_scan_status');
  }

  /**
   * Simulate a CV submission and scan
   */
  async submitCV(file: File): Promise<void> {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        this.setScanStatus({
          hasCompletedScan: true,
          cvId: 'cv-' + Math.random().toString(36).substr(2, 9),
          targetRole: 'Data Scientist', // Default mock role
          matchPercentage: 92,
          lastScanDate: new Date().toISOString(),
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          versionName: file.name.split('.')[0]
        });
        resolve();
      }, 2000);
    });
  }
}
