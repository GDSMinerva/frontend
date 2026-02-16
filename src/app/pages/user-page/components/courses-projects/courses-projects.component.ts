import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';

interface Course {
  id: string;
  title: string;
  provider: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  rating?: number;
  priceTag?: string; // For things like "FREE CERTIFIED"
  price?: string; // Display price e.g. "$12.99"
  originalPrice?: string; // e.g. "$84.99"
  duration: string;
  level?: string;
  actionText: string;
  url: string;
  category: string; // Added for filtering
}

interface Project {
  id: string;
  title: string;
  difficulty: string;
  timeEstimate: string;
  technologies: string[];
  status: 'active' | 'locked' | 'completed';
  description?: string; // Optional
}

interface CVScanStatus {
  hasCompletedScan: boolean;
  cvId?: string;
  targetRole?: string;
  matchPercentage?: number;
}

interface LearningPlan {
  id: string;
  title: string;
  completed: boolean;
}

interface SkillGap {
  name: string;
  priority: 'Critical' | 'High' | 'Medium';
  priorityClass: string;
  current: number;
  target: number;
  barClass: string;
  actionText: string;
}

interface ConnectedAccount {
  name: string;
  icon: string; // Material symbol icon name
  connected: boolean;
}

interface ProgressStats {
  readinessScore: number;
  readinessTarget: number;
  skillsMastered: number;
  timeInvested: string;
  projectsDone: number;
  cvImpact: string;
}

interface AccountConnection {
  totalCourses?: number;
  totalProjects?: number;
  activeLearningPath?: string;
}

@Component({
  selector: 'app-courses-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, NgClass, NgFor, NgIf],
  templateUrl: './courses-projects.component.html',
  styleUrl: './courses-projects.component.css'
})
export class CoursesProjectsComponent implements OnInit {
  private router = inject(Router);

  // CV Status & Header Signals
  cvScanStatus = signal<CVScanStatus>({ hasCompletedScan: false });
  currentRole = signal<string>('Data Scientist');
  matchPercentage = signal<number>(92);
  autoSyncEnabled = signal(true);
  
  // Progress Statistics (API-ready)
  progressStats = signal<ProgressStats>({
    readinessScore: 65,
    readinessTarget: 90,
    skillsMastered: 14,
    timeInvested: '38.5h',
    projectsDone: 3,
    cvImpact: '+12%'
  });

  // Course statistics
  totalCoursesAvailable = signal<number>(127);
  totalProjectsAvailable = signal<number>(45);
  
  // Account connection stats
  connectionStats = signal<AccountConnection>({
    totalCourses: 3,
    totalProjects: 1,
    activeLearningPath: 'Data Science Specialist'
  });
  
  learningPlans = signal<LearningPlan[]>([
    { id: '1', title: 'Module 4: Pandas Advanced', completed: false },
    { id: '2', title: 'SQL Query Optimization Quiz', completed: true },
    { id: '3', title: 'Start Churn Prediction Project', completed: false }
  ]);
  
  skillGaps = signal<SkillGap[]>([
    { 
      name: 'Machine Learning', 
      priority: 'Critical', 
      priorityClass: 'bg-red-100 dark:bg-red-500/80 text-red-700 dark:text-white shadow-red-500/20',
      current: 30, 
      target: 85, 
      barClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
      actionText: 'Quick Start: Fast.ai'
    },
    { 
      name: 'Python (Data Science)', 
      priority: 'High', 
      priorityClass: 'bg-orange-100 dark:bg-orange-500/80 text-orange-700 dark:text-white shadow-orange-500/20',
      current: 45, 
      target: 95, 
      barClass: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]',
      actionText: 'Real Python Article'
    },
    { 
      name: 'SQL Optimization', 
      priority: 'Medium', 
      priorityClass: 'bg-purple-100 dark:bg-purple-500/80 text-purple-700 dark:text-white shadow-purple-500/20',
      current: 70, 
      target: 90, 
      barClass: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
      actionText: 'Kaggle SQL Path'
    }
  ]);

  courses = signal<Course[]>([
    {
      id: '1',
      title: 'Python for Everybody',
      provider: 'Coursera',
      icon: 'code',
      iconBgClass: 'bg-purple-500/10 border-purple-500/20',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      rating: 4.8,
      duration: '10 hrs',
      level: 'Beginner',
      actionText: 'Start Learning',
      url: '#',
      category: 'All'
    },
    {
      id: '2',
      title: 'Scientific Computing',
      provider: 'freeCodeCamp',
      icon: 'article',
      iconBgClass: 'bg-cyan-500/10 border-cyan-500/20',
      iconColorClass: 'text-cyan-600 dark:text-cyan-400',
      priceTag: 'FREE CERTIFIED',
      duration: '300 hrs',
      actionText: 'Start Free Course',
      url: '#',
      category: 'All' 
    },
    {
      id: '3',
      title: 'Complete Python Bootcamp',
      provider: 'Udemy',
      icon: 'psychology',
      iconBgClass: 'bg-purple-500/10 border-purple-500/20',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      rating: 4.7,
      price: '$12.99',
      originalPrice: '$84.99',
      duration: '22 hrs',
      actionText: 'View on Udemy',
      url: '#',
      category: 'Paid' // Example
    },
    {
      id: '4',
      title: 'Machine Learning Specialization',
      provider: 'Coursera',
      icon: 'psychology',
      iconBgClass: 'bg-purple-500/10 border-purple-500/20',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      rating: 4.9,
      duration: '36 hrs',
      level: 'Advanced',
      actionText: 'Enroll Now',
      url: '#',
      category: 'All'
    },
    {
      id: '5',
      title: 'SQL for Data Analysis',
      provider: 'Udacity',
      icon: 'storage',
      iconBgClass: 'bg-cyan-500/10 border-cyan-500/20',
      iconColorClass: 'text-cyan-600 dark:text-cyan-400',
      priceTag: 'FREE',
      duration: '8 hrs',
      actionText: 'Start Free',
      url: '#',
      category: 'Free'
    }
  ]);

  connectedAccounts = signal<ConnectedAccount[]>([
    { name: 'Coursera', icon: 'school', connected: true },
    { name: 'Udemy', icon: 'play_circle', connected: false },
    { name: 'freeCodeCamp', icon: 'code', connected: false }
  ]);

  // Filters & Tabs
  courseFilters = ['All', 'Free', 'Certificates', '< 10 Hours', 'Paid'];
  activeFilter = signal('All');
  
  // Derived state
  filteredCourses = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'All') return this.courses();
    
    // Simple logic for demo purposes matching visual expectations
    if (filter === 'Free') return this.courses().filter(c => c.priceTag?.includes('FREE') || c.category === 'Free');
    if (filter === 'Paid') return this.courses().filter(c => c.price || c.category === 'Paid');
    if (filter === '< 10 Hours') return this.courses().filter(c => c.duration.includes('10 hrs') || c.duration.includes('8 hrs')); 
    
    return this.courses(); 
  });

  // UI State
  isLoading = signal(false);

  ngOnInit(): void {
    this.checkCVScanStatus();
  }
  
  /**
   * Fetch all dashboard statistics from API
   * TODO: Replace with actual API call
   */
  async fetchDashboardStats(): Promise<void> {
    // TODO: const stats = await this.apiService.getProgressStats();
    // this.progressStats.set(stats);
    
    // For now, use sample data
    this.progressStats.set({
      readinessScore: 65,
      readinessTarget: 90,
      skillsMastered: 14,
      timeInvested: '38.5h',
      projectsDone: 3,
      cvImpact: '+12%'
    });
  }

  /**
   * Fetch learning plans from API
   * TODO: Replace with actual API call
   */
  async fetchLearningPlans(): Promise<void> {
    // TODO: const plans = await this.apiService.getLearningPlans();
    // this.learningPlans.set(plans);
  }

  /**
   * Fetch skill gaps from API based on CV analysis
   * TODO: Replace with actual API call
   */
  async fetchSkillGaps(): Promise<void> {
    // TODO: const gaps = await this.apiService.getSkillGaps(cvId);
    // this.skillGaps.set(gaps);
  }

  /**
   * Fetch recommended courses from API
   * TODO: Replace with actual API call
   */
  async fetchCourses(): Promise<void> {
    // TODO: const courses = await this.apiService.getRecommendedCourses(targetRole);
    // this.courses.set(courses);
  }

  /**
   * Fetch account connection status from API
   * TODO: Replace with actual API call
   */
  async fetchConnectedAccounts(): Promise<void> {
    // TODO: const accounts = await this.apiService.getConnectedAccounts();
    // this.connectedAccounts.set(accounts);
  }
  
  async checkCVScanStatus(): Promise<void> {
    this.isLoading.set(true);
    
    // TODO: Replace with actual API call
    // const status = await this.cvService.checkScanStatus();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Set to true to show the Active State
    this.cvScanStatus.set({
      hasCompletedScan: true, 
      cvId: 'cv-001',
      targetRole: 'Data Scientist',
      matchPercentage: 92
    });
    
    if (this.cvScanStatus().hasCompletedScan) {
      // Load all data from API
      await Promise.all([
        this.fetchDashboardStats(),
        this.fetchLearningPlans(),
        this.fetchSkillGaps(),
        this.fetchCourses(),
        this.fetchConnectedAccounts()
      ]);
    }
    
    this.isLoading.set(false);
  }

  toggleSyncMode(): void {
    this.autoSyncEnabled.update(v => !v);
  }

  togglePlanCompletion(planId: string): void {
    this.learningPlans.update(plans => 
      plans.map(p => p.id === planId ? { ...p, completed: !p.completed } : p)
    );
  }

  setActiveFilter(filter: string): void {
    this.activeFilter.set(filter);
  }

  enrollInCourse(course: Course): void {
    console.log('Enrolling in:', course.title);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/user/dashboard']);
  }
}