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
  durationHours: number; // Added for precise filtering
  hasCertificate: boolean; // Added for precise filtering
  level?: string;
  actionText: string;
  url: string;
  category: string; // Added for filtering
  status: 'not-started' | 'in-progress' | 'completed'; // Added for tracking enrollment
  progressPercent?: number; // Progress tracked in enrolled courses
  skillCategory: string; // Added for mapping to skill gaps
}

interface EnrolledCourse {
  id: string;
  courseId: string;
  courseTitle: string;
  provider: string;
  url: string;
  skillCategory: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  status: 'in-progress' | 'completed';
  progressPercent: number;
  hasCertificate: boolean;
  certificateUrl?: string;
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

interface WeeklyPlanItem {
  id: string;
  courseId: string;
  courseTitle: string;
  provider: string;
  url: string;
  skillCategory: string;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  completed: boolean;
}

interface SkillGap {
  name: string;
  priority: 'Critical' | 'High' | 'Medium';
  priorityClass: string;
  current: number;
  target: number;
  barClass: string;
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
  // Progress Statistics (Reactive to skillGaps)
  progressStats = computed<ProgressStats>(() => {
    const gaps = this.skillGaps();
    if (gaps.length === 0) return {
      readinessScore: 0,
       readinessTarget: 90,
       skillsMastered: 0,
       timeInvested: '38.5h',
       projectsDone: 3,
       cvImpact: '+0%'
    };

    // Calculate readiness score as weighted average of current/target
    const totalProgress = gaps.reduce((acc, gap) => acc + (gap.current / gap.target), 0);
    const avgProgress = (totalProgress / gaps.length) * 100;
    
    // Count mastered skills (current >= target)
    const mastered = gaps.filter(g => g.current >= g.target).length;

    return {
      readinessScore: Math.min(100, Math.round(avgProgress)),
      readinessTarget: 90,
      skillsMastered: 14 + mastered, // Base 14 + newly mastered
      timeInvested: '38.5h',
      projectsDone: 3,
      cvImpact: `+${Math.round(avgProgress / 7)}%`
    };
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
  
  weeklyPlanItems = signal<WeeklyPlanItem[]>([
    {
      id: 'wp1',
      courseId: '4',
      courseTitle: 'Machine Learning Specialization',
      provider: 'Coursera',
      url: '#',
      skillCategory: 'Machine Learning',
      icon: 'psychology',
      iconBgClass: 'bg-purple-500/10 border-purple-500/20',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      completed: false
    },
    {
      id: 'wp2',
      courseId: '1',
      courseTitle: 'Python for Everybody',
      provider: 'Coursera',
      url: '#',
      skillCategory: 'Python (Data Science)',
      icon: 'code',
      iconBgClass: 'bg-purple-500/10 border-purple-500/20',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      completed: false
    },
    {
      id: 'wp3',
      courseId: '5',
      courseTitle: 'SQL for Data Analysis',
      provider: 'Udacity',
      url: '#',
      skillCategory: 'SQL Optimization',
      icon: 'storage',
      iconBgClass: 'bg-cyan-500/10 border-cyan-500/20',
      iconColorClass: 'text-cyan-600 dark:text-cyan-400',
      completed: false
    }
  ]);

  weeklyPlanFilter = signal<string>('All');
  weeklyPlanDropdownOpen = signal(false);
  weeklyPlanPage = signal(0);
  weeklyPlanPageSize = 2;
  
  categoryIcons: Record<string, string> = {
    'All': 'language',
    'Machine Learning': 'psychology',
    'Python (Data Science)': 'code',
    'SQL Optimization': 'storage'
  };

  weeklyPlanCategories = computed(() => {
    const categories = ['All', ...new Set(this.weeklyPlanItems().map(i => i.skillCategory))];
    return categories.map(cat => ({
      name: cat,
      icon: this.categoryIcons[cat] || 'category'
    }));
  });

  filteredWeeklyPlan = computed(() => {
    const filter = this.weeklyPlanFilter();
    const all = this.weeklyPlanItems();
    return filter === 'All' ? all : all.filter(i => i.skillCategory === filter);
  });

  paginatedWeeklyPlan = computed(() => {
    const start = this.weeklyPlanPage() * this.weeklyPlanPageSize;
    return this.filteredWeeklyPlan().slice(start, start + this.weeklyPlanPageSize);
  });

  totalWeeklyPlanPages = computed(() => Math.ceil(this.filteredWeeklyPlan().length / this.weeklyPlanPageSize));

  
  skillGaps = signal<SkillGap[]>([
    { 
      name: 'Machine Learning', 
      priority: 'Critical', 
      priorityClass: 'bg-red-100 dark:bg-red-500/80 text-red-700 dark:text-white shadow-red-500/20',
      current: 30, 
      target: 85, 
      barClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
    },
    { 
      name: 'Python (Data Science)', 
      priority: 'High', 
      priorityClass: 'bg-orange-100 dark:bg-orange-500/80 text-orange-700 dark:text-white shadow-orange-500/20',
      current: 45, 
      target: 95, 
      barClass: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
    },
    { 
      name: 'SQL Optimization', 
      priority: 'Medium', 
      priorityClass: 'bg-purple-100 dark:bg-purple-500/80 text-purple-700 dark:text-white shadow-purple-500/20',
      current: 70, 
      target: 90, 
      barClass: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
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
      durationHours: 10,
      hasCertificate: true,
      level: 'Beginner',
      actionText: 'Start Learning',
      url: '#',
      category: 'All',
      status: 'in-progress',
      progressPercent: 35,
      skillCategory: 'Python (Data Science)'
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
      durationHours: 300,
      hasCertificate: true,
      actionText: 'Start Free Course',
      url: '#',
      category: 'All',
      status: 'not-started',
      progressPercent: 0,
      skillCategory: 'General'
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
      durationHours: 22,
      hasCertificate: true,
      actionText: 'View on Udemy',
      url: '#',
      category: 'Paid',
      status: 'completed',
      progressPercent: 100,
      skillCategory: 'Python (Data Science)'
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
      durationHours: 36,
      hasCertificate: true,
      level: 'Advanced',
      actionText: 'Enroll Now',
      url: '#',
      category: 'All',
      status: 'not-started',
      progressPercent: 0,
      skillCategory: 'Machine Learning'
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
      durationHours: 8,
      hasCertificate: false,
      actionText: 'Start Free',
      url: '#',
      category: 'Free',
      status: 'in-progress',
      progressPercent: 62,
      skillCategory: 'SQL Optimization'
    },
    {
      id: '6',
      title: 'Python for Everybody 2',
      provider: 'Coursera',
      icon: 'code',
      iconBgClass: 'bg-purple-500/10 border-purple-500/20',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      rating: 4.8,
      duration: '10 hrs',
      durationHours: 10,
      hasCertificate: true,
      level: 'Beginner',
      actionText: 'Start Learning',
      url: '#',
      category: 'All',
      status: 'in-progress',
      progressPercent: 35,
      skillCategory: 'Python (Data Science)'
    }
  ]);

  projects = signal<Project[]>([
    {
      id: 'p1',
      title: 'Customer Churn Prediction',
      difficulty: 'Medium',
      timeEstimate: '8h',
      technologies: ['Python', 'Scikit-Learn'],
      status: 'active',
      description: 'Build a predictive model to identify customers at risk of leaving.'
    },
    {
      id: 'p2',
      title: 'Advanced Neural Networks',
      difficulty: 'High',
      timeEstimate: '12h',
      technologies: ['PyTorch', 'Fast.ai'],
      status: 'locked',
      description: 'ML Specialist Path'
    },
    {
      id: 'p3',
      title: 'Data Visualization Dashboard',
      difficulty: 'Low',
      timeEstimate: '4h',
      technologies: ['Tableau', 'SQL'],
      status: 'completed',
      description: 'Completed last week'
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
    
    if (filter === 'Free') return this.courses().filter(c => c.priceTag?.includes('FREE') || c.category === 'Free');
    if (filter === 'Paid') return this.courses().filter(c => c.price || c.category === 'Paid');
    if (filter === 'Certificates') return this.courses().filter(c => c.hasCertificate);
    if (filter === '< 10 Hours') return this.courses().filter(c => c.durationHours < 10);
    
    return this.courses(); 
  });
  enrolledCourses = signal<EnrolledCourse[]>([
    {
      id: 'ec1',
      courseId: '4',
      courseTitle: 'Machine Learning Specialization',
      provider: 'Coursera',
      url: '#',
      skillCategory: 'Machine Learning',
      icon: 'psychology',
      iconBgClass: 'bg-purple-500/10 border-purple-500/20',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      status: 'in-progress',
      progressPercent: 0,
      hasCertificate: true
    },
    {
      id: 'ec2',
      courseId: '1',
      courseTitle: 'Python for Everybody',
      provider: 'Coursera',
      url: '#',
      skillCategory: 'Python (Data Science)',
      icon: 'code',
      iconBgClass: 'bg-purple-500/10 border-purple-500/20',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      status: 'in-progress',
      progressPercent: 35,
      hasCertificate: true
    },
    {
      id: 'ec3',
      courseId: '5',
      courseTitle: 'SQL for Data Analysis',
      provider: 'Udacity',
      url: '#',
      skillCategory: 'SQL Optimization',
      icon: 'storage',
      iconBgClass: 'bg-cyan-500/10 border-cyan-500/20',
      iconColorClass: 'text-cyan-600 dark:text-cyan-400',
      status: 'in-progress',
      progressPercent: 62,
      hasCertificate: false
    }
  ]);

  enrolledBySkill = computed(() => {
    const map = new Map<string, EnrolledCourse[]>();
    this.enrolledCourses().forEach(e => {
      if (!map.has(e.skillCategory)) {
        map.set(e.skillCategory, []);
      }
      map.get(e.skillCategory)!.push(e);
    });
    return map;
  });

  completedLearning = signal<EnrolledCourse[]>([]);
  finishingCourseIds = signal<string[]>([]);
  downloadingCertificateIds = signal<string[]>([]);
  openSkillEnrollmentList = signal<string | null>(null);

  enrolledCountBySkill(skillName: string): number {
    return this.enrolledBySkill().get(skillName)?.length || 0;
  }

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
    // For now, this is derived from skillGaps computed
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

  togglePlanCompletion(itemId: string): void {
    this.weeklyPlanItems.update(items => 
      items.map(p => p.id === itemId ? { ...p, completed: !p.completed } : p)
    );
  }

  deleteWeeklyPlanItem(id: string): void {
    const item = this.weeklyPlanItems().find(i => i.id === id);
    if (item) {
      // Remove from enrolled courses as well
      this.enrolledCourses.update(courses => courses.filter(c => c.courseId !== item.courseId));
      // Remove from weekly plan
      this.weeklyPlanItems.update(items => items.filter(p => p.id !== id));
    }
  }

  setWeeklyPlanFilter(cat: string): void {
    this.weeklyPlanFilter.set(cat);
    this.weeklyPlanPage.set(0); // Reset page on filter change
  }

  setWeeklyPlanPage(page: number): void {
    if (page >= 0 && page < this.totalWeeklyPlanPages()) {
      this.weeklyPlanPage.set(page);
    }
  }

  setActiveFilter(filter: string): void {
    this.activeFilter.set(filter);
  }

  enrollInCourse(course: Course): void {
    this.enrollCourse(course);
  }

  enrollCourse(course: Course): void {
    // Check if already enrolled or completed
    if (this.isEnrolled(course.id) || this.isCompleted(course.id)) return;

    const isFirstInSkill = !this.enrolledCourses().some(e => e.skillCategory === course.skillCategory);

    const newEnrolled: EnrolledCourse = {
      id: `ec-${Math.random().toString(36).substring(2, 9)}`,
      courseId: course.id,
      courseTitle: course.title,
      provider: course.provider,
      url: course.url,
      skillCategory: course.skillCategory,
      icon: course.icon,
      iconBgClass: course.iconBgClass,
      iconColorClass: course.iconColorClass,
      status: 'in-progress',
      progressPercent: 0,
      hasCertificate: course.hasCertificate
    };

    this.enrolledCourses.update(courses => [...courses, newEnrolled]);

    if (isFirstInSkill) {
      const newPlanItem: WeeklyPlanItem = {
        id: `wp-${Math.random().toString(36).substring(2, 9)}`,
        courseId: course.id,
        courseTitle: course.title,
        provider: course.provider,
        url: course.url,
        skillCategory: course.skillCategory,
        icon: course.icon,
        iconBgClass: course.iconBgClass,
        iconColorClass: course.iconColorClass,
        completed: false
      };
      this.weeklyPlanItems.update(items => [...items, newPlanItem]);
    }
  }


  toggleEnrollmentList(skillName: string | null): void {
    this.openSkillEnrollmentList.update(current => 
      current === skillName || skillName === null ? null : skillName
    );
  }

  deleteEnrolledCourse(enrolledId: string): void {
    const enrolled = this.enrolledCourses().find(c => c.id === enrolledId);
    if (enrolled) {
      // Remove from weekly plan as well
      this.weeklyPlanItems.update(items => items.filter(i => i.courseId !== enrolled.courseId));
      // Remove from enrolled
      this.enrolledCourses.update(courses => courses.filter(c => c.id !== enrolledId));
    }
  }

  finishEnrolledCourse(enrolledId: string): void {
    const course = this.enrolledCourses().find(c => c.id === enrolledId);
    if (!course || this.finishingCourseIds().includes(course.courseId)) return;

    // Show finishing message by courseId to sync animation across UIs
    this.finishingCourseIds.update(ids => [...ids, course.courseId]);

    // Delay the actual completion
    setTimeout(() => {
      // Remove from finishing state
      this.finishingCourseIds.update(ids => ids.filter(id => id !== course.courseId));

      // Remove from enrolled
      this.enrolledCourses.update(courses => courses.filter(c => c.id !== enrolledId));

      // ALSO remove from weekly plan
      this.weeklyPlanItems.update(items => items.filter(i => i.courseId !== course.courseId));

      // Update skill gap (+5 capped at target)
      this.skillGaps.update(gaps => gaps.map(gap => {
        if (gap.name === course.skillCategory) {
          return { ...gap, current: Math.min(gap.target, gap.current + 5) };
        }
        return gap;
      }));

      // Add to completed
      const completedCourse: EnrolledCourse = {
        ...course,
        status: 'completed',
        progressPercent: 100,
        hasCertificate: course.hasCertificate,
        certificateUrl: 'https://example.com/certificate' // Mock URL
      };
      this.completedLearning.update(prev => [...prev, completedCourse]);
    }, 2000);
  }

  downloadCertificate(course: EnrolledCourse): void {
    if (!course.hasCertificate || this.downloadingCertificateIds().includes(course.id)) return;

    this.downloadingCertificateIds.update(ids => [...ids, course.id]);

    setTimeout(() => {
      this.downloadingCertificateIds.update(ids => ids.filter(id => id !== course.id));
      if (course.certificateUrl) {
        window.open(course.certificateUrl, '_blank');
      }
    }, 1500);
  }

  completeWeeklyItem(item: WeeklyPlanItem): void {
    const enrolled = this.enrolledCourses().find(ec => ec.courseId === item.courseId);
    if (enrolled) {
      this.finishEnrolledCourse(enrolled.id);
    } else {
      // If not enrolled (unlikely here but for safety), just delete
      this.deleteWeeklyPlanItem(item.id);
    }
  }

  isEnrolled(courseId: string): boolean {
    return this.enrolledCourses().some(e => e.courseId === courseId);
  }

  isCompleted(courseId: string): boolean {
    return this.completedLearning().some(e => e.courseId === courseId);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/user/dashboard']);
  }

  openSkillResource(url: string): void {
    window.open(url, '_blank', 'noopener');
  }

  // Removed setPlanPage as pagination is no longer used for weeklyPlanItems.
}