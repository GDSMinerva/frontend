import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Interfaces ---

interface SampleJob {
  id: string;
  title: string;
  description?: string;
}

interface CVFile {
  id: string;
  file: File | null;
  fileName: string;
  fileSize: string;
  uploadDate: string;
}

interface JobDescription {
  text: string;
  source: 'manual' | 'sample';
  sampleIds?: string[];
}

interface CVAnalysisResult {
  id: string;
  cvId: string;
  matchScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  recommendations: string[];
  salaryEstimate?: { min: number; max: number };
  experienceLevel: string;
  topMatchingRoles: Array<{ title: string; matchScore: number }>;
  scanDate: string;
}

enum DashboardState {
  UPLOAD = 'upload',
  RESULTS = 'results'
}

@Component({
  selector: 'app-dashboard-feature',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardComponent {
  // Dashboard state
  currentState = signal<DashboardState>(DashboardState.UPLOAD);
  
  // Upload form state
  uploadedCV = signal<CVFile | null>(null);
  jobDescription = signal<JobDescription>({ text: '', source: 'manual' });
  selectedSampleJobs = signal<string[]>([]);
  resumeInputMode = signal<'file' | 'paste'>('file');
  pastedResume = signal<string>('');
  
  // Analysis results
  analysisResults = signal<CVAnalysisResult | null>(null);
  
  // UI state
  isScanning = signal(false);
  scanProgress = signal(0);
  errorMessage = signal<string | null>(null);
  isDragging = signal(false);
  actionError = signal<string | null>(null);

  private clearErrorAfterDelay(): void {
    setTimeout(() => {
      this.actionError.set(null);
      this.errorMessage.set(null);
    }, 2000);
  }

  /** Sample job titles - will be replaced with API data later */
  readonly sampleJobTitles: SampleJob[] = [
    { id: 'dev-001', title: 'Developer' },
    { id: 'dev-002', title: 'Hadoop Developer' },
    { id: 'dev-003', title: 'Magento Developer' },
    { id: 'sec-001', title: 'Security Analyst' },
    { id: 'data-001', title: 'Data Scientist' },
    { id: 'pm-001', title: 'Product Manager' },
  ];

  /**
   * Handle file upload from input
   */
  /**
   * Handle file upload from input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  /**
   * Process the uploaded/dropped file
   */
  handleFile(file: File): void {
    // Validate file type
    // Using broad type checking or extension checking as MIME types can vary
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.pdf', '.docx', '.doc'];
    const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      this.errorMessage.set('Please upload a PDF or DOCX file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('File size must be less than 5MB');
      return;
    }
    
    this.uploadedCV.set({
      id: `cv-${Date.now()}`,
      file,
      fileName: file.name,
      fileSize: this.formatFileSize(file.size),
      uploadDate: new Date().toISOString()
    });
    this.errorMessage.set(null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onPaste(event: ClipboardEvent): void {
    if (event.clipboardData && event.clipboardData.files.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      this.handleFile(event.clipboardData.files[0]);
    }
  }
  
  
  /**
   * Trigger file input click
   */
  triggerFileUpload(): void {
    const fileInput = document.getElementById('cv-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  
  /**
   * Remove uploaded CV
   */
  removeUploadedCV(): void {
    if (confirm('Remove this resume? You will need to re-upload or paste it again.')) {
      this.uploadedCV.set(null);
      const fileInput = document.getElementById('cv-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }
  
  /**
   * Update job description from textarea
   */
  updateJobDescription(text: string): void {
    this.jobDescription.update(desc => ({
      ...desc,
      text,
      source: 'manual'
    }));
  }
  
  /**
   * Toggle selection of a sample job
   */
  toggleSampleJob(jobTitle: string): void {
    const currentJobs = this.selectedSampleJobs();
    if (currentJobs.includes(jobTitle)) {
      this.selectedSampleJobs.set(currentJobs.filter(j => j !== jobTitle));
    } else {
      this.selectedSampleJobs.set([...currentJobs, jobTitle]);
    }
    
    // Update job description source logic if needed
    // For now we keep manual text as separate from sample selection
    if (this.selectedSampleJobs().length > 0) {
      this.jobDescription.update(desc => ({
        ...desc,
        source: 'sample',
        sampleIds: this.selectedSampleJobs()
      }));
    }
  }
  
  /**
   * Check if a sample job is currently selected
   */
  isSampleJobSelected(jobTitle: string): boolean {
    return this.selectedSampleJobs().includes(jobTitle);
  }

  getSampleJobByTitle(title: string): SampleJob | undefined {
    return this.sampleJobTitles.find(job => job.title === title);
  }

  toggleResumeInputMode(): void {
    this.resumeInputMode.set(this.resumeInputMode() === 'file' ? 'paste' : 'file');
  }
  
  
  /**
   * Validate form before scanning
   */
  canStartScan(): boolean {
    const hasCV = this.uploadedCV() !== null || this.pastedResume().length > 0;
    const hasJobDesc = this.jobDescription().text.length > 0 || this.selectedSampleJobs().length > 0;
    return hasCV && hasJobDesc;
  }
  
  /**
   * Start AI scan
   */
  async startScan(): Promise<void> {
    if (!this.canStartScan()) {
      const hasCV = this.uploadedCV() !== null || this.pastedResume().length > 0;
      const hasJobDesc = this.jobDescription().text.length > 0 || this.selectedSampleJobs().length > 0;
      
      if (!hasCV && !hasJobDesc) {
        this.errorMessage.set('Please provide both a resume and a job description.');
      } else if (!hasCV) {
        this.errorMessage.set('Resume missing. Please upload or paste your resume.');
      } else {
        this.errorMessage.set('Job description missing. Please paste one or select a sample.');
      }
      this.clearErrorAfterDelay();
      return;
    }
    
    this.isScanning.set(true);
    this.scanProgress.set(0);
    this.errorMessage.set(null);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      this.scanProgress.update(p => Math.min(p + 10, 90));
    }, 200);
    
    try {
      // Simulate failure
      if (Math.random() < 0.1) {
        throw new Error('Neural engine processing failed. Service temporarily unavailable.');
      }

      // Simulate API call
      await this.simulateScanAPI();
      
      clearInterval(progressInterval);
      this.scanProgress.set(100);
      
      // Wait a bit to show 100% before transitioning
      setTimeout(() => {
        this.currentState.set(DashboardState.RESULTS);
        this.isScanning.set(false);
        this.scanProgress.set(0);
      }, 500);
      
    } catch (error: any) {
      clearInterval(progressInterval);
      this.isScanning.set(false);
      this.scanProgress.set(0);
      this.errorMessage.set(error.message || 'Scan failed. Please try again.');
      this.clearErrorAfterDelay();
      console.error('Scan error:', error);
    }
  }
  
  /**
   * Simulate API call with sample results
   */
  private async simulateScanAPI(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cvId = this.uploadedCV()?.id || 'pasted-resume-' + Date.now();
        this.analysisResults.set({
          id: `analysis-${Date.now()}`,
          cvId: cvId,
          matchScore: 82,
          strengths: [
            'Strong technical skills in React and TypeScript',
            '5+ years of relevant experience',
            'Leadership and team management experience',
            'Excellent communication skills'
          ],
          weaknesses: [
            'Limited cloud infrastructure experience',
            'No mention of CI/CD pipeline experience'
          ],
          missingSkills: [
            'Kubernetes',
            'Docker',
            'AWS/Azure',
            'GraphQL'
          ],
          recommendations: [
            'Add cloud platform certifications to boost profile',
            'Highlight any containerization experience',
            'Emphasize scalability projects',
            'Include metrics and quantifiable achievements'
          ],
          salaryEstimate: { min: 120000, max: 160000 },
          experienceLevel: 'Senior',
          topMatchingRoles: [
            { title: 'Senior Frontend Engineer', matchScore: 92 },
            { title: 'Full Stack Developer', matchScore: 85 },
            { title: 'Technical Lead', matchScore: 78 }
          ],
          scanDate: new Date().toISOString()
        });
        resolve();
      }, 2000); // 2 second delay
    });
  }
  
  /**
   * Start a new scan (reset to upload state)
   */
  startNewScan(): void {
    this.currentState.set(DashboardState.UPLOAD);
    this.uploadedCV.set(null);
    this.jobDescription.set({ text: '', source: 'manual' });
    this.selectedSampleJobs.set([]);
    this.pastedResume.set('');
    this.analysisResults.set(null);
    this.errorMessage.set(null);
    
    // Reset file input
    const fileInput = document.getElementById('cv-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}