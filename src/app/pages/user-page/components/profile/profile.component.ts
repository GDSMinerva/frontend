import { Component, signal, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService, UserProfile } from '../../../../services/profile.service';

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
      // Simulate API call
      setTimeout(() => {
        const formValues = this.profileForm.value;
        this.profileService.setUserProfile(formValues);
        this.isEditingProfile.set(false);
        this.isLoading.set(false);
        // In real app, call this.updateProfile(formValues);
      }, 1000);
    }
  }

  deleteSkill(skillId: string): void {
    this.hardSkills.update(skills => skills.filter(s => s.id !== skillId));
    this.softSkills.update(skills => skills.filter(s => s.id !== skillId));
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
    if (confirm('Are you sure you want to delete this CV?')) {
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
      // TODO: Call API to upload file
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
    if (confirm('Are you sure you want to remove your profile picture?')) {
      const defaultAvatar = 'assets/images/default-avatar.png'; // Or generate from name
      this.profileService.updateAvatar(defaultAvatar);
    }
  }



  exportData(format: 'pdf' | 'zip' | 'json'): void {
    this.isLoading.set(true);
    // Simulate export delay
    setTimeout(() => {
      this.isLoading.set(false);
      alert(`Your data has been exported as ${format.toUpperCase()}. Check your downloads folder.`);
    }, 1500);
  }

  deleteAccount(): void {
    if (confirm('WARNING: This action cannot be undone. Are you sure you want to permanently delete your account and all associated data?')) {
      this.isLoading.set(true);
      
      // Simulate API call
      // TODO: Implement API call to delete account
      // this.apiService.deleteAccount().subscribe(...)

      setTimeout(() => {
        this.isLoading.set(false);
        // alert('Account deletion scheduled. Redirecting to home...'); // Optional: removed alert to just do the action
        this.router.navigate(['/sign-up']);
      }, 2000);
    }
  }
}