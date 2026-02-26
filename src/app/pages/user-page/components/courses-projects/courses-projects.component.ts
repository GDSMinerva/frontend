import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { CvScanService } from '../../../../services/cv-scan.service';

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

interface SkillProject {
  id: string;
  skillCategory: string; // must match a SkillGap name exactly
  title: string;
  description: string;
  difficulty: 'Simple' | 'Medium' | 'Hard';
  difficultyPoints: number; // Simple=5, Medium=10, Hard=20 (added to skill current% on completion)
  timeEstimate: string;
  technologies: string[];
  status: 'not-started' | 'in-progress' | 'completed';
  checklist: { id: string; label: string; checked: boolean }[];
  githubUrl?: string;
  submissionResult?: { completionQuality: number; skillCoverage: number; improvementLevel: string };
}

interface CVScanStatus {
  hasCompletedScan: boolean;
  cvId?: string;
  targetRole?: string;
  matchPercentage?: number;
}

interface RoleProfile {
  role: string;
  matchPercentage: number;
  skillGaps: SkillGap[];
  courses: Course[];
  projects: Project[];
  weeklyPlanItems: WeeklyPlanItem[];
  progressStats: {
    readinessScore: number;
    readinessTarget: number;
    skillsMastered: number;
    timeInvested: string;
    projectsDone: number;
    cvImpact: string;
  };
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
  private cvScanService = inject(CvScanService);

  // CV Status from global service
  cvScanStatus = this.cvScanService.cvStatus;
  
  // Role Selection Signals
  isRoleDropdownOpen = signal(false);
  selectedRole = signal<string>('Data Scientist');
  
  // Computed for current profile
  currentRole = computed(() => this.selectedRole());
  currentRoleProfile = computed(() => this.roleProfiles.find(r => r.role === this.selectedRole()));
  
  availableRoles = computed(() => this.roleProfiles.map(p => ({
    title: p.role,
    matchRate: p.matchPercentage
  })));

  // Role Profiles Data
  readonly roleProfiles: RoleProfile[] = [
    {
      // TODO: replace with API call
      role: 'Data Scientist',
      matchPercentage: 92,
      progressStats: {
        readinessScore: 78,
        readinessTarget: 90,
        skillsMastered: 14,
        timeInvested: '38.5h',
        projectsDone: 3,
        cvImpact: '+12%'
      },
      skillGaps: [
        { 
          name: 'Machine Learning', 
          priority: 'Critical', 
          priorityClass: 'bg-red-100 dark:bg-red-500/80 text-red-700 dark:text-white shadow-red-500/20',
          current: 30, target: 85, 
          barClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
        },
        { 
          name: 'Python (Data Science)', 
          priority: 'High', 
          priorityClass: 'bg-orange-100 dark:bg-orange-500/80 text-orange-700 dark:text-white shadow-orange-500/20',
          current: 45, target: 95, 
          barClass: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
        },
        { 
          name: 'SQL Optimization', 
          priority: 'Medium', 
          priorityClass: 'bg-purple-100 dark:bg-purple-500/80 text-purple-700 dark:text-white shadow-purple-500/20',
          current: 70, target: 90, 
          barClass: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
        }
      ],
      courses: [
        {
          id: '1', title: 'Python for Everybody', provider: 'Coursera', icon: 'code',
          iconBgClass: 'bg-purple-500/10 border-purple-500/20', iconColorClass: 'text-purple-600 dark:text-purple-400',
          rating: 4.8, duration: '10 hrs', durationHours: 10, hasCertificate: true, level: 'Beginner',
          actionText: 'View Course', url: '#', category: 'All', status: 'not-started', skillCategory: 'Python (Data Science)'
        },
        {
          id: '4', title: 'Machine Learning Specialization', provider: 'Coursera', icon: 'psychology',
          iconBgClass: 'bg-purple-500/10 border-purple-500/20', iconColorClass: 'text-purple-600 dark:text-purple-400',
          rating: 4.9, duration: '36 hrs', durationHours: 36, hasCertificate: true, level: 'Advanced',
          actionText: 'View Course', url: '#', category: 'All', status: 'not-started', skillCategory: 'Machine Learning'
        },
        {
          id: '5', title: 'SQL for Data Analysis', provider: 'Udacity', icon: 'storage',
          iconBgClass: 'bg-cyan-500/10 border-cyan-500/20', iconColorClass: 'text-cyan-600 dark:text-cyan-400',
          priceTag: 'FREE', duration: '8 hrs', durationHours: 8, hasCertificate: false,
          actionText: 'View Course', url: '#', category: 'Free', status: 'not-started', skillCategory: 'SQL Optimization'
        }
      ],
      projects: [
        {
          id: 'p1', title: 'Customer Churn Prediction', difficulty: 'Medium', timeEstimate: '8h',
          technologies: ['Python', 'Scikit-Learn'], status: 'active', description: 'Build a predictive model to identify customers at risk of leaving.'
        },
        {
          id: 'p2', title: 'Advanced Neural Networks', difficulty: 'High', timeEstimate: '12h',
          technologies: ['PyTorch', 'Fast.ai'], status: 'locked', description: 'ML Specialist Path'
        },
        {
          id: 'p3', title: 'Data Visualization Dashboard', difficulty: 'Low', timeEstimate: '4h',
          technologies: ['Tableau', 'SQL'], status: 'completed', description: 'Completed last week'
        }
      ],
      weeklyPlanItems: [
        {
          id: 'wp1', courseId: '4', courseTitle: 'Machine Learning Specialization', provider: 'Coursera',
          url: '#', skillCategory: 'Machine Learning', icon: 'psychology',
          iconBgClass: 'bg-purple-500/10 border-purple-500/20', iconColorClass: 'text-purple-600 dark:text-purple-400',
          completed: false
        }
      ]
    },
    {
      // TODO: replace with API call
      role: 'Machine Learning Engineer',
      matchPercentage: 85,
      progressStats: {
        readinessScore: 65,
        readinessTarget: 95,
        skillsMastered: 10,
        timeInvested: '45h',
        projectsDone: 2,
        cvImpact: '+8%'
      },
      skillGaps: [
        { 
          name: 'Deep Learning', 
          priority: 'Critical', 
          priorityClass: 'bg-red-100 dark:bg-red-500/80 text-red-700 dark:text-white shadow-red-500/20',
          current: 20, target: 90, 
          barClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
        },
        { 
          name: 'MLOps', 
          priority: 'High', 
          priorityClass: 'bg-orange-100 dark:bg-orange-500/80 text-orange-700 dark:text-white shadow-orange-500/20',
          current: 15, target: 80, 
          barClass: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
        },
        { 
          name: 'Python (Engineering)', 
          priority: 'Medium', 
          priorityClass: 'bg-purple-100 dark:bg-purple-500/80 text-purple-700 dark:text-white shadow-purple-500/20',
          current: 60, target: 95, 
          barClass: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
        }
      ],
      courses: [
        {
          id: 'm1', title: 'Deep Learning Specialization', provider: 'Coursera', icon: 'psychology',
          iconBgClass: 'bg-purple-500/10 border-purple-500/20', iconColorClass: 'text-purple-600 dark:text-purple-400',
          rating: 4.9, duration: '50 hrs', durationHours: 50, hasCertificate: true, level: 'Advanced',
          actionText: 'Start specialization', url: '#', category: 'All', status: 'not-started', skillCategory: 'Deep Learning'
        },
        {
          id: 'm2', title: 'MLOps Fundamentals', provider: 'Google Cloud', icon: 'settings',
          iconBgClass: 'bg-blue-500/10 border-blue-500/20', iconColorClass: 'text-blue-600 dark:text-blue-400',
          rating: 4.7, duration: '15 hrs', durationHours: 15, hasCertificate: true, level: 'Intermediate',
          actionText: 'View course', url: '#', category: 'All', status: 'not-started', skillCategory: 'MLOps'
        }
      ],
      projects: [
        {
          id: 'mp1', title: 'Object Detection System', difficulty: 'High', timeEstimate: '20h',
          technologies: ['PyTorch', 'OpenCV'], status: 'active', description: 'Real-time object detection using YOLO.'
        },
        {
          id: 'mp2', title: 'ML Pipeline on AWS', difficulty: 'High', timeEstimate: '15h',
          technologies: ['AWS', 'Sagemaker'], status: 'locked', description: 'Automated ML deployment.'
        }
      ],
      weeklyPlanItems: [
        {
          id: 'mwp1', courseId: 'm1', courseTitle: 'Deep Learning Specialization', provider: 'Coursera',
          url: '#', skillCategory: 'Deep Learning', icon: 'psychology',
          iconBgClass: 'bg-purple-500/10 border-purple-500/20', iconColorClass: 'text-purple-600 dark:text-purple-400',
          completed: false
        }
      ]
    },
    {
      // TODO: replace with API call
      role: 'Data Analyst',
      matchPercentage: 95,
      progressStats: {
        readinessScore: 88,
        readinessTarget: 95,
        skillsMastered: 18,
        timeInvested: '25h',
        projectsDone: 5,
        cvImpact: '+15%'
      },
      skillGaps: [
        { 
          name: 'SQL', 
          priority: 'Critical', 
          priorityClass: 'bg-red-100 dark:bg-red-500/80 text-red-700 dark:text-white shadow-red-500/20',
          current: 65, target: 100, 
          barClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
        },
        { 
          name: 'Tableau', 
          priority: 'High', 
          priorityClass: 'bg-orange-100 dark:bg-orange-500/80 text-orange-700 dark:text-white shadow-orange-500/20',
          current: 40, target: 90, 
          barClass: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
        }
      ],
      courses: [
        {
          id: 'a1', title: 'Advanced SQL for Analytics', provider: 'Udemy', icon: 'storage',
          iconBgClass: 'bg-cyan-500/10 border-cyan-500/20', iconColorClass: 'text-cyan-600 dark:text-cyan-400',
          rating: 4.6, duration: '12 hrs', durationHours: 12, hasCertificate: true, level: 'Intermediate',
          actionText: 'Buy for $12.99', url: '#', category: 'Paid', status: 'not-started', skillCategory: 'SQL'
        },
        {
          id: 'a2', title: 'Tableau Desktop Specialist', provider: 'Tableau', icon: 'bar_chart',
          iconBgClass: 'bg-blue-500/10 border-blue-500/20', iconColorClass: 'text-blue-600 dark:text-blue-400',
          rating: 4.8, duration: '20 hrs', durationHours: 20, hasCertificate: true, level: 'Intermediate',
          actionText: 'Start Certification', url: '#', category: 'All', status: 'not-started', skillCategory: 'Tableau'
        }
      ],
      projects: [
        {
          id: 'ap1', title: 'Sales Performance Dashboard', difficulty: 'Low', timeEstimate: '5h',
          technologies: ['Tableau', 'Excel'], status: 'active', description: 'Interactive sales monitoring.'
        }
      ],
      weeklyPlanItems: [
        {
          id: 'awp1', courseId: 'a1', courseTitle: 'Advanced SQL for Analytics', provider: 'Udemy',
          url: '#', skillCategory: 'SQL', icon: 'storage',
          iconBgClass: 'bg-cyan-500/10 border-cyan-500/20', iconColorClass: 'text-cyan-600 dark:text-cyan-400',
          completed: false
        }
      ]
    },
    {
      // TODO: replace with API call
      role: 'AI Research Scientist',
      matchPercentage: 78,
      progressStats: {
        readinessScore: 55,
        readinessTarget: 90,
        skillsMastered: 8,
        timeInvested: '60h',
        projectsDone: 1,
        cvImpact: '+5%'
      },
      skillGaps: [
        { 
          name: 'PyTorch Research', 
          priority: 'Critical', 
          priorityClass: 'bg-red-100 dark:bg-red-500/80 text-red-700 dark:text-white shadow-red-500/20',
          current: 10, target: 95, 
          barClass: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
        },
        { 
          name: 'Math Foundations', 
          priority: 'High', 
          priorityClass: 'bg-orange-100 dark:bg-orange-500/80 text-orange-700 dark:text-white shadow-orange-500/20',
          current: 50, target: 95, 
          barClass: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
        }
      ],
      courses: [
        {
          id: 'r1', title: 'Research at Scale with PyTorch', provider: 'Meta AI', icon: 'psychology',
          iconBgClass: 'bg-purple-500/10 border-purple-500/20', iconColorClass: 'text-purple-600 dark:text-purple-400',
          rating: 5.0, duration: '40 hrs', durationHours: 40, hasCertificate: true, level: 'Advanced',
          actionText: 'View course', url: '#', category: 'All', status: 'not-started', skillCategory: 'PyTorch Research'
        }
      ],
      projects: [
        {
          id: 'rp1', title: 'LLM Fine-tuning', difficulty: 'High', timeEstimate: '30h',
          technologies: ['PyTorch', 'HuggingFace'], status: 'active', description: 'Training large models.'
        }
      ],
      weeklyPlanItems: [
        {
          id: 'rwp1', courseId: 'r1', courseTitle: 'Research at Scale with PyTorch', provider: 'Meta AI',
          url: '#', skillCategory: 'PyTorch Research', icon: 'psychology',
          iconBgClass: 'bg-purple-500/10 border-purple-500/20', iconColorClass: 'text-purple-600 dark:text-purple-400',
          completed: false
        }
      ]
    }
  ];

  // Current View Data Signals (Initialized from Data Scientist profile)
  skillGaps = signal<SkillGap[]>(this.roleProfiles[0].skillGaps);
  courses = signal<Course[]>(this.roleProfiles[0].courses);
  projects = signal<Project[]>(this.roleProfiles[0].projects);
  weeklyPlanItems = signal<WeeklyPlanItem[]>(this.roleProfiles[0].weeklyPlanItems);
  matchPercentage = signal<number>(this.roleProfiles[0].matchPercentage);
  // Progress Statistics (Reactive to current profile and project status)
  progressStats = computed<ProgressStats>(() => {
    this.skillProjects(); // Dependency to update when projects are completed
    const profile = this.currentRoleProfile();
    if (!profile) return {
       readinessScore: 0, readinessTarget: 90, skillsMastered: 0,
       timeInvested: '0h', projectsDone: 0, cvImpact: '+0%'
    };
    return profile.progressStats;
  });

  inProgressProjects = computed(() => this.skillProjects().filter(p => p.status === 'in-progress'));
  completedProjects = computed(() => this.skillProjects().filter(p => p.status === 'completed'));

  projectsBySkill(skillName: string): SkillProject[] {
    return this.skillProjects().filter(p => p.skillCategory === skillName);
  }
  // Course statistics
  totalCoursesAvailable = signal<number>(127);
  totalProjectsAvailable = signal<number>(45);

  activeProjectId = signal<string | null>(null);
  activeProject = computed(() => this.skillProjects().find(p => p.id === this.activeProjectId()) ?? null);

  // TODO: replace with API call
  skillProjects = signal<SkillProject[]>([
    {
      id: 'ml-1',
      skillCategory: 'Machine Learning',
      title: 'Iris Classifier',
      description: 'A classic beginner project to understand classification. You will build a model to classify iris species based on flower measurements.',
      difficulty: 'Simple',
      difficultyPoints: 5,
      timeEstimate: '2-3h',
      technologies: ['Python', 'Scikit-Learn', 'NumPy'],
      status: 'not-started',
      checklist: [
        { id: 'ml1-1', label: 'Load and inspect dataset', checked: true },
        { id: 'ml1-2', label: 'Perform EDA with Matplotlib', checked: true },
        { id: 'ml1-3', label: 'Train a Random Forest classifier', checked: false },
        { id: 'ml1-4', label: 'Evaluate model accuracy', checked: false }
      ]
    },
    {
      id: 'ml-2',
      skillCategory: 'Machine Learning',
      title: 'Customer Churn Prediction',
      description: 'Predict which customers are likely to churn using historical behavior data. Focuses on feature engineering and binary classification.',
      difficulty: 'Medium',
      difficultyPoints: 10,
      timeEstimate: '6-8h',
      technologies: ['Python', 'Pandas', 'XGBoost', 'Seaborn'],
      status: 'not-started',
      checklist: [
        { id: 'ml2-1', label: 'Handle missing data and encoding', checked: false },
        { id: 'ml2-2', label: 'Engineeer behavioral features', checked: false },
        { id: 'ml2-3', label: 'Compare Logistic Regression vs XGBoost', checked: false },
        { id: 'ml2-4', label: 'Calculate F1-score and Recall', checked: false }
      ]
    },
    {
      id: 'ml-3',
      skillCategory: 'Machine Learning',
      title: 'Neural Network from Scratch',
      description: 'Implement backpropagation, forward passes, and gradient descent using only NumPy. Deeply understand how weights are updated.',
      difficulty: 'Hard',
      difficultyPoints: 20,
      timeEstimate: '15-20h',
      technologies: ['Python', 'NumPy', 'Mathematics'],
      status: 'not-started',
      checklist: [
        { id: 'ml3-1', label: 'Implement matrix multiplication', checked: false },
        { id: 'ml3-2', label: 'Code activation functions (Sigmoid/ReLU)', checked: false },
        { id: 'ml3-3', label: 'Write backpropagation logic', checked: false },
        { id: 'ml3-4', label: 'Test on MNIST dataset', checked: false }
      ]
    },
    {
      id: 'py-1',
      skillCategory: 'Python (Data Science)',
      title: 'Data Cleaning Script',
      description: 'Build a reusable script that automates the process of identifying and fixing data quality issues in large CSV files.',
      difficulty: 'Simple',
      difficultyPoints: 5,
      timeEstimate: '1-2h',
      technologies: ['Python', 'Pandas', 'CSV'],
      status: 'not-started',
      checklist: [
        { id: 'py1-1', label: 'Detect duplicate rows', checked: true },
        { id: 'py1-2', label: 'Normalize date formats', checked: false },
        { id: 'py1-3', label: 'Handle outliers with Z-score', checked: false }
      ]
    },
    {
      id: 'py-2',
      skillCategory: 'Python (Data Science)',
      title: 'Web Scraper for Jobs',
      description: 'Create a scraper that extracts job postings for Data Science roles and stores them in a structured database.',
      difficulty: 'Medium',
      difficultyPoints: 10,
      timeEstimate: '4-5h',
      technologies: ['Python', 'BeautifulSoup', 'Requests', 'SQLite'],
      status: 'not-started',
      checklist: [
        { id: 'py2-1', label: 'Handle pagination in search results', checked: false },
        { id: 'py2-2', label: 'Extract title, company, and salary', checked: false },
        { id: 'py2-3', label: 'Save data to SQLite database', checked: false }
      ]
    },
    {
      id: 'py-3',
      skillCategory: 'Python (Data Science)',
      title: 'Desktop Automation Tool',
      description: 'Build a sophisticated tool that monitors folders and automatically organizes files based on their content using NLP.',
      difficulty: 'Hard',
      difficultyPoints: 20,
      timeEstimate: '10-12h',
      technologies: ['Python', 'OS', 'Spacy', 'Watchdog'],
      status: 'not-started',
      checklist: [
        { id: 'py3-1', label: 'Setup filesystem event watcher', checked: false },
        { id: 'py3-2', label: 'Categorize files using NLP', checked: false },
        { id: 'py3-3', label: 'Generate weekly activity report', checked: false }
      ]
    },
    {
      id: 'sql-1',
      skillCategory: 'SQL Optimization',
      title: 'Query Performance Audit',
      description: 'Analyze a set of slow-running queries and identify bottlenecks using execution plans and performance metrics.',
      difficulty: 'Simple',
      difficultyPoints: 5,
      timeEstimate: '2-3h',
      technologies: ['SQL', 'PostgreSQL', 'EXPLAIN ANALYZE'],
      status: 'not-started',
      checklist: [
        { id: 'sql1-1', label: 'Generate query execution plans', checked: true },
        { id: 'sql1-2', label: 'Identify sequential scans', checked: false },
        { id: 'sql1-3', label: 'Suggest basic indexing fixes', checked: false }
      ]
    },
    {
      id: 'sql-2',
      skillCategory: 'SQL Optimization',
      title: 'Index Migration Plan',
      description: 'Design and simulate a migration plan for a database with 10M+ rows, focusing on zero-downtime indexing.',
      difficulty: 'Medium',
      difficultyPoints: 10,
      timeEstimate: '5-7h',
      technologies: ['PostgreSQL', 'SQL', 'Benchmark-Tools'],
      status: 'not-started',
      checklist: [
        { id: 'sql2-1', label: 'Create covering indexes', checked: false },
        { id: 'sql2-2', label: 'Measure I/O reduction', checked: false },
        { id: 'sql2-3', label: 'Draft the migration script', checked: false }
      ]
    },
    {
      id: 'sql-3',
      skillCategory: 'SQL Optimization',
      title: 'Database Partitioning Strategy',
      description: 'Architect a table partitioning strategy for a multi-terabyte dataset to improve query performance and maintenance.',
      difficulty: 'Hard',
      difficultyPoints: 20,
      timeEstimate: '12-15h',
      technologies: ['PostgreSQL', 'SQL Architecture', 'Scalability'],
      status: 'not-started',
      checklist: [
        { id: 'sql3-1', label: 'Implement range partitioning by date', checked: false },
        { id: 'sql3-2', label: 'Configure partition pruning', checked: false },
        { id: 'sql3-3', label: 'Setup maintenance automation tasks', checked: false }
      ]
    }
  ]);

  // Account connection stats
  connectionStats = signal<AccountConnection>({
    totalCourses: 3,
    totalProjects: 1,
    activeLearningPath: 'Data Science Specialist'
  });

  // Weekly Plan Signals
  weeklyPlanFilter = signal<string>('All');
  weeklyPlanDropdownOpen = signal(false);
  weeklyPlanPage = signal(0);
  weeklyPlanPageSize = 2;
  
  categoryIcons: Record<string, string> = {
    'All': 'language',
    'Machine Learning': 'psychology',
    'Python (Data Science)': 'code',
    'SQL Optimization': 'storage',
    'Deep Learning': 'psychology',
    'MLOps': 'settings',
    'SQL': 'storage',
    'Tableau': 'bar_chart',
    'PyTorch Research': 'psychology'
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
  openSkillProjectList = signal<string | null>(null);
  actionError = signal<string | null>(null);

  private clearErrorAfterDelay(): void {
    setTimeout(() => this.actionError.set(null), 2000);
  }

  isMaxEnrolled(skillCategory: string): boolean {
    return this.enrolledCountBySkill(skillCategory) >= 3;
  }

  enrolledCountBySkill(skillName: string): number {
    return this.enrolledBySkill().get(skillName)?.length || 0;
  }

  projectCountBySkill(skillName: string): number {
    return this.projectsBySkill(skillName).length;
  }

  // UI State
  isLoading = signal(false);
  projectGithubUrl = '';
  selectedFile = signal<File | null>(null);

  startProject(projectId: string): void {
    this.skillProjects.update(projects => 
      projects.map(p => p.id === projectId ? { ...p, status: 'in-progress' } : p)
    );
    this.activeProjectId.set(projectId);
  }

  continueProject(projectId: string): void {
    this.activeProjectId.set(projectId);
  }

  toggleProjectChecklistItem(projectId: string, itemId: string): void {
    this.skillProjects.update(projects => 
      projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            checklist: p.checklist.map(item => 
              item.id === itemId ? { ...item, checked: !item.checked } : item
            )
          };
        }
        return p;
      })
    );
  }

  async submitProject(projectId: string, githubUrl: string): Promise<void> {
    this.isLoading.set(true);
    // TODO: replace with real API submission
    await new Promise(resolve => setTimeout(resolve, 1200));

    const project = this.skillProjects().find(p => p.id === projectId);
    if (!project) {
      this.isLoading.set(false);
      return;
    }

    const quality = Math.floor(Math.random() * 31) + 70; // 70–100
    const coverage = Math.floor(Math.random() * 41) + 60; // 60–100
    let level = 'Good';
    if (quality >= 90) level = 'Excellent';
    else if (quality >= 80) level = 'Great';

    this.skillProjects.update(projects => 
      projects.map(p => p.id === projectId ? { 
        ...p, 
        status: 'completed',
        githubUrl: githubUrl,
        submissionResult: {
          completionQuality: quality,
          skillCoverage: coverage,
          improvementLevel: level
        }
      } : p)
    );

    // Increase skill gap
    this.skillGaps.update(gaps => gaps.map(gap => {
      if (gap.name === project.skillCategory) {
        return {
          ...gap,
          current: Math.min(gap.target, gap.current + project.difficultyPoints)
        };
      }
      return gap;
    }));

    // Increments progressStats().projectsDone by 1
    const profile = this.roleProfiles.find(r => r.role === this.selectedRole());
    if (profile) {
      profile.progressStats.projectsDone += 1;
    }

    this.projectGithubUrl = '';
    this.selectedFile.set(null);
    this.isLoading.set(false);
  }

  triggerFileSelect(): void {
    const fileInput = document.getElementById('project-file-input') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  previousProject(currentId: string): void {
    const current = this.skillProjects().find(p => p.id === currentId);
    if (!current) return;
    const siblingProjects = this.projectsBySkill(current.skillCategory);
    const index = siblingProjects.findIndex(p => p.id === currentId);
    if (index > 0) {
      this.activeProjectId.set(siblingProjects[index - 1].id);
    }
  }

  nextProject(currentId: string): void {
    const current = this.skillProjects().find(p => p.id === currentId);
    if (!current) return;
    const siblingProjects = this.projectsBySkill(current.skillCategory);
    const index = siblingProjects.findIndex(p => p.id === currentId);
    if (index >= 0 && index < siblingProjects.length - 1) {
      this.activeProjectId.set(siblingProjects[index + 1].id);
    }
  }

  closeProjectDetail(): void {
    this.activeProjectId.set(null);
  }

  getCheckedCount(project: SkillProject | null): number {
    if (!project) return 0;
    return project.checklist.filter(item => item.checked).length;
  }

  getProjectIndex(projectId: string, skillCategory: string): number {
    return this.projectsBySkill(skillCategory).findIndex(p => p.id === projectId);
  }

  ngOnInit(): void {
    this.checkCVScanStatus();
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  private onDocumentClick(event: MouseEvent): void {
    const switcher = document.getElementById('role-switcher');
    if (switcher && !switcher.contains(event.target as Node)) {
      this.isRoleDropdownOpen.set(false);
    }
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
    // Use service status
    const status = this.cvScanService.cvStatus();
    
    if (status.hasCompletedScan) {
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



  togglePlanCompletion(itemId: string): void {
    this.weeklyPlanItems.update(items => 
      items.map(p => p.id === itemId ? { ...p, completed: !p.completed } : p)
    );
  }

  deleteWeeklyPlanItem(id: string): void {
    const item = this.weeklyPlanItems().find(i => i.id === id);
    if (item) {
      if (!confirm(`Remove "${item.courseTitle}" from your weekly plan? Your enrolled progress for this course will also be removed.`)) {
        return;
      }
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

  toggleProjectList(skillName: string | null): void {
    this.openSkillProjectList.update(current => 
      current === skillName || skillName === null ? null : skillName
    );
  }

  deleteEnrolledCourse(enrolledId: string): void {
    const enrolled = this.enrolledCourses().find(c => c.id === enrolledId);
    if (enrolled) {
      if (!confirm(`Remove "${enrolled.courseTitle}" from your enrolled courses? Your progress will be lost.`)) {
        return;
      }
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

    // Simulated failure
    if (Math.random() < 0.1) {
      setTimeout(() => {
        this.actionError.set('Cloud sync failed. Skill credit not applied.');
        this.clearErrorAfterDelay();
        this.finishingCourseIds.update(ids => ids.filter(id => id !== course.courseId));
      }, 1000);
      return;
    }

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

    if (Math.random() < 0.1) {
      setTimeout(() => {
        this.actionError.set('Certificate generator is currently busy. Try again later.');
        this.clearErrorAfterDelay();
        this.downloadingCertificateIds.update(ids => ids.filter(id => id !== course.id));
      }, 1000);
      return;
    }

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

  selectRole(roleName: string): void {
    this.selectedRole.set(roleName);
    const profile = this.roleProfiles.find(r => r.role === roleName);
    
    if (profile) {
      this.skillGaps.set([...profile.skillGaps]);
      this.courses.set([...profile.courses]);
      this.projects.set([...profile.projects]);
      this.weeklyPlanItems.set([...profile.weeklyPlanItems]);
      this.matchPercentage.set(profile.matchPercentage);
    }

    // Reset components to fresh state
    this.enrolledCourses.set([]);
    this.completedLearning.set([]);
    this.openSkillEnrollmentList.set(null);
    this.weeklyPlanFilter.set('All');
    this.activeFilter.set('All');
    this.isRoleDropdownOpen.set(false);
  }

  toggleRoleDropdown(): void {
    this.isRoleDropdownOpen.update(v => !v);
  }

  toggleAccountConnection(account: ConnectedAccount): void {
    if (account.connected) {
      if (!confirm(`Disconnect ${account.name}? Your synced progress data will no longer update automatically.`)) {
        return;
      }
    }
    
    // Logic to toggle connection
    this.connectedAccounts.update(accounts => 
      accounts.map(a => a.name === account.name ? { ...a, connected: !a.connected } : a)
    );
  }
}