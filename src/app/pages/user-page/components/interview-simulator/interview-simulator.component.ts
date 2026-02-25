
import { Component, OnInit, OnDestroy, signal, computed, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SavedQuestionsService, SavedQuestion } from '../../../../services/saved-questions.service';
import { SavedJobsService } from '../../../../services/saved-jobs.service';

enum SimulatorState {
  LOCKED = 'locked',
  MODE_SELECTION = 'mode_selection',
  ACTIVE_SIMULATOR = 'active_simulator'
}

enum SimulatorMode {
  PRACTICE = 'practice',
  ASSISTANT = 'assistant'
}

interface ModeConfig {
  mode: SimulatorMode;
  name: string;
  description: string;
  features: string[];
  icon: string;
  color: string;
}

interface InterviewQuestion {
  id: string;
  question: string;
  category: 'technical' | 'behavioral' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedDuration: number; // in seconds
  idealAnswer?: string;
  keyPoints?: string[];
  options?: string[]; // For MCQ style questions
  correctOptionIndex?: number;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

interface UserAnswer {
  questionId: string;
  answer: string; // Could be text or selected option index as string
  timeSpent: number; // in seconds
  timestamp: string;
  score?: number; // 0-100
  feedback?: string;
  selectedOptionIndex?: number;
}

interface SimulationSession {
  id: string;
  jobTitle: string;
  cvId: string;
  mode: SimulatorMode;
  questions: InterviewQuestion[];
  answers: UserAnswer[];
  currentQuestionIndex: number;
  startTime: string;
  endTime?: string;
  totalScore: number;
  status: 'in-progress' | 'completed' | 'paused';
}

interface SimulationProgress {
  questionsCompleted: number;
  totalQuestions: number;
  averageTimePerQuestion: number;
  currentScore: number;
  progressPercentage: number;
}

interface CVScanStatus {
  hasCompletedScan: boolean;
  cvId?: string;
  lastScanDate?: string;
  targetJobTitle?: string;
}

@Component({
  selector: 'app-interview-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interview-simulator.component.html',
  styleUrl: './interview-simulator.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InterviewSimulatorComponent implements OnInit, OnDestroy {
  private savedQuestionsService = inject(SavedQuestionsService);
  private savedJobsService = inject(SavedJobsService);
  private router = inject(Router);

  // --- Saved Questions Signals ---
  savedQuestions = this.savedQuestionsService.savedQuestions;
  savedQuestionsPage = signal(1);
  savedQuestionsSort = signal<'date' | 'importance'>('date');
  readonly QUESTIONS_PER_PAGE = 3;

  showSavedModal = signal(false);
  selectedSavedQuestion = signal<SavedQuestion | null>(null);

  // --- Custom Simulation Signals ---
  isCustomizing = signal(false);
  targetRole = signal<string>('');
  techSkills = signal<string[]>([]);
  softSkills = signal<string[]>([]);
  techCount = signal<number>(5);
  softCount = signal<number>(3);

  // Role Options
  availableRoles = computed(() => {
    const roles: { title: string, category: string, categoryClass: string }[] = [];
    
    // 1. CV Primary Role
    if (this.cvScanStatus().targetJobTitle) {
      roles.push({ 
        title: this.cvScanStatus().targetJobTitle!, 
        category: '📄 CV Primary Role',
        categoryClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
      });
    }
    
    // 2. Saved Jobs
    this.savedJobsService.savedJobs().forEach((j: any) => {
      if (!roles.some(r => r.title === j.title)) {
        roles.push({ 
          title: j.title, 
          category: '💼 Saved Job',
          categoryClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
        });
      }
    });
    
    // 3. Static/Suggested Roles
    const suggested = [
      { title: 'Full Stack Engineer', category: '🌐 Suggested Role' },
      { title: 'Frontend Developer', category: '🔥 Matched Job' },
      { title: 'Backend Developer', category: '🌐 Suggested Role' },
      { title: 'DevOps Engineer', category: '💼 Saved Job' },
      { title: 'Data Scientist', category: '🎯 Career Goal' }
    ];

    suggested.forEach(s => {
      if (!roles.some(r => r.title === s.title)) {
        let colorClass = 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-400';
        if (s.category.includes('Career Goal')) colorClass = 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
        if (s.category.includes('Matched Job')) colorClass = 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400';
        
        roles.push({ 
          title: s.title, 
          category: s.category,
          categoryClass: colorClass
        });
      }
    });
      
    return roles;
  });

  // Skill Options
  readonly hardSkillOptions = ['SQL', 'System Design', 'Angular', 'React', 'Distributed Systems', 'Python', 'Go', 'Docker', 'Kubernetes'];
  readonly softSkillOptions = ['Communication', 'Leadership', 'Time Management', 'Problem Solving', 'Adaptability', 'Teamwork', 'Critical Thinking'];

  // --- Result Modal ---
  showResultModal = signal(false);
  simulationScore = signal(0);
  correctAnswersCount = signal(0);
  wrongAnswersCount = signal(0);
  aiFeedbackSummary = signal('');

  // --- State management ---
  currentState = signal<SimulatorState>(SimulatorState.LOCKED);
  selectedMode = signal<SimulatorMode | null>(null);

  // CV Scan Status
  cvScanStatus = signal<CVScanStatus>({ hasCompletedScan: false });

  // Mode configurations
  readonly modeOptions: ModeConfig[] = [
    {
      mode: SimulatorMode.PRACTICE,
      name: 'Practice Mode',
      description: 'Self-paced interview practice with no time pressure. Perfect for learning and building confidence.',
      features: [
        'No time limit per question',
        'Review and edit answers anytime',
        'Detailed AI feedback after each response',
        'Skip and return to questions',
        'Save progress and continue later'
      ],
      icon: 'school',
      color: 'blue'
    },
    {
      mode: SimulatorMode.ASSISTANT,
      name: 'Assistant Mode',
      description: 'Realistic interview simulation with timer and pressure. Mimics real interview conditions.',
      features: [
        'Timed questions (recommended duration)',
        'Real-time performance tracking',
        'Pressure simulation',
        'Time management scoring',
        'Interview readiness assessment'
      ],
      icon: 'timer',
      color: 'purple'
    }
  ];
  
  // Simulation data (only loaded if CV scan completed)
  currentSession = signal<SimulationSession | null>(null);
  currentQuestion = signal<InterviewQuestion | null>(null);
  currentAnswer = signal<string>('');
  
  // Progress tracking
  progress = signal<SimulationProgress>({
    questionsCompleted: 0,
    totalQuestions: 0,
    averageTimePerQuestion: 0,
    currentScore: 0,
    progressPercentage: 0
  });
  
  // Timer state
  questionTimer = signal<number>(0); // Elapsed time
  
  // Assistant Mode Timer
  isTimerEnabled = computed(() => this.selectedMode() === SimulatorMode.ASSISTANT);
  questionTimeLimit = signal<number>(180); // Default 3 minutes
  timeRemaining = signal<number>(180);
  
  private timerInterval?: ReturnType<typeof setInterval>;
  
  // UI state
  isLoading = signal(false);
  isRecording = signal(false);
  showFeedback = signal(false);
  currentFeedback = signal<string>('');
  selectedOption = signal<number | null>(null);
  
  // --- Computed for Saved Questions Section ---
  sortedSavedQuestions = computed(() => {
    const qs = [...this.savedQuestions()];
    if (this.savedQuestionsSort() === 'importance') {
      return qs.sort((a, b) => {
        if (a.isImportant === b.isImportant) return (new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        return a.isImportant ? -1 : 1;
      });
    }
    return qs.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  });

  totalPages = computed(() => Math.ceil(this.sortedSavedQuestions().length / this.QUESTIONS_PER_PAGE));

  paginatedSavedQuestions = computed(() => {
    const start = (this.savedQuestionsPage() - 1) * this.QUESTIONS_PER_PAGE;
    return this.sortedSavedQuestions().slice(start, start + this.QUESTIONS_PER_PAGE);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.savedQuestionsPage();
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  });

  constructor() {}

  async ngOnInit(): Promise<void> {
    await this.checkCVScanStatus();
  }
  
  ngOnDestroy(): void {
    this.stopTimer();
  }
  
  /**
   * Check if user has completed a CV scan
   * This determines which view to show
   */
  async checkCVScanStatus(): Promise<void> {
    this.isLoading.set(true);
    
    // TODO: Replace with actual API call
    // const status = await this.cvService.checkScanStatus();
    // this.cvScanStatus.set(status);
    
    // Simulate API delay
    setTimeout(async () => {
      // For testing - set to false to see locked state, true to see simulator mode selection
      const hasCompletedScan = true; // Change to true to test mode selection
      
      this.cvScanStatus.set({
        hasCompletedScan, 
        cvId: hasCompletedScan ? 'cv-001' : undefined,
        lastScanDate: hasCompletedScan ? '2024-01-15' : undefined,
        targetJobTitle: hasCompletedScan ? 'Senior Frontend Developer' : undefined
      });
      
      // Set initial state based on CV scan status
      if (hasCompletedScan) {
        this.currentState.set(SimulatorState.MODE_SELECTION);
        // Default preselection
        if (this.availableRoles().length > 0) {
          this.targetRole.set(this.availableRoles()[0].title);
        }
      } else {
        this.currentState.set(SimulatorState.LOCKED);
      }
      
      this.isLoading.set(false);
    }, 1000);
  }

  /**
   * Select a mode and start simulation
   */
  selectMode(modeStr: string): void {
    const mode = modeStr as SimulatorMode;
    this.selectedMode.set(mode);
    this.initializeSimulation();
  }

  /**
   * Toggle the customization panel
   */
  toggleCustomization(): void {
    this.isCustomizing.update(v => !v);
    if (this.isCustomizing() && !this.targetRole()) {
      if (this.availableRoles().length > 0) {
        this.targetRole.set(this.availableRoles()[0].title);
      }
    }
  }

  toggleSkill(skill: string, type: 'hard' | 'soft'): void {
    if (type === 'hard') {
      this.techSkills.update(s => s.includes(skill) ? s.filter(x => x !== skill) : [...s, skill]);
    } else {
      this.softSkills.update(s => s.includes(skill) ? s.filter(x => x !== skill) : [...s, skill]);
    }
  }

  /**
   * Initialize interview simulation
   * Only called if user has completed CV scan
   */
  async initializeSimulation(): Promise<void> {
    this.isLoading.set(true);

    // TODO: Fetch questions from API based on CV and job description
    // const questions = await this.interviewService.generateQuestions(cvId, jobTitle);
    
    // Sample data for testing
    const session: SimulationSession = {
      id: `session-${Date.now()}`,
      jobTitle: this.cvScanStatus().targetJobTitle || 'Software Developer',
      cvId: this.cvScanStatus().cvId || '',
      mode: this.selectedMode()!,
      questions: this.sampleQuestions,
      answers: [],
      currentQuestionIndex: 0,
      startTime: new Date().toISOString(),
      totalScore: 0,
      status: 'in-progress'
    };
    
    this.currentSession.set(session);
    this.currentState.set(SimulatorState.ACTIVE_SIMULATOR);
    this.loadQuestion(0);
    this.updateProgress();
    this.isLoading.set(false);
  }
  
  /**
   * Load a specific question
   */
  loadQuestion(index: number): void {
    const session = this.currentSession();
    if (session && session.questions[index]) {
      const question = session.questions[index];
      this.currentQuestion.set(question);
      this.currentAnswer.set('');
      this.selectedOption.set(null);
      this.showFeedback.set(false);
      
      if (this.isTimerEnabled()) {
        this.questionTimeLimit.set(question.expectedDuration || 180);
        this.startCountdownTimer();
      } else {
        this.startElapsedTimer();
      }
    }
  }

  /**
   * Start countdown timer (Assistant Mode)
   */
  startCountdownTimer(): void {
    this.stopTimer();
    const limit = this.questionTimeLimit();
    this.timeRemaining.set(limit);
    
    this.timerInterval = setInterval(() => {
      this.timeRemaining.update(t => {
        const newTime = t - 1;
        if (newTime <= 0) {
          this.stopTimer();
          this.handleTimeExpired();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }

  /**
   * Start elapsed timer (Practice Mode)
   */
  startElapsedTimer(): void {
    this.stopTimer();
    this.questionTimer.set(0);
    
    this.timerInterval = setInterval(() => {
      this.questionTimer.update(t => t + 1);
    }, 1000);
  }
  
  /**
   * Stop timer
   */
  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  /**
   * Handle when time expires in Assistant Mode
   */
  handleTimeExpired(): void {
    // End the entire simulation immediately when the timer reaches 0
    this.completeSimulation();
  }

  selectOption(index: number): void {
      this.selectedOption.set(index);
  }
  
  /**
   * Submit answer for current question
   */
  submitAnswer(): void {
    const session = this.currentSession();
    const question = this.currentQuestion();
    const answerText = this.currentAnswer();
    const selectedOpt = this.selectedOption();
    
    if (!session || !question) {
      return;
    }

    // Validation
    if (question.options && selectedOpt === null) {
        return; // Must select an option
    }
    if (!question.options && !answerText.trim()) {
        return; // Must type an answer
    }
    
    this.stopTimer();
    // Removed loading state
    
    // Determine time spent
    let timeSpent = 0;
    if (this.isTimerEnabled()) {
        timeSpent = this.questionTimeLimit() - this.timeRemaining();
    } else {
        timeSpent = this.questionTimer();
    }
    
    // Create answer object
    const answer: UserAnswer = {
      questionId: question.id,
      answer: question.options ? question.options[selectedOpt!] : answerText,
      selectedOptionIndex: selectedOpt !== null ? selectedOpt : undefined,
      timeSpent: timeSpent,
      timestamp: new Date().toISOString()
    };
    
    // Get AI feedback (Instant)
    this.simulateAIFeedback(answer, question);
    
    // Add answer to session
    this.currentSession.update(s => ({
      ...s!,
      answers: [...s!.answers, answer]
    }));
    
    this.showFeedback.set(true);
    this.currentFeedback.set(answer.feedback || '');
    this.updateProgress();
  }
  
  /**
   * Move to next question
   */
  nextQuestion(): void {
    const session = this.currentSession();
    if (!session) return;
    
    const nextIndex = session.currentQuestionIndex + 1;
    
    if (nextIndex < session.questions.length) {
      this.currentSession.update(s => ({
        ...s!,
        currentQuestionIndex: nextIndex
      }));
      this.loadQuestion(nextIndex);
    } else {
      this.completeSimulation();
    }
  }
  
  /**
   * Go to previous question
   */
  previousQuestion(): void {
    const session = this.currentSession();
    if (!session || session.currentQuestionIndex === 0) return;
    
    const prevIndex = session.currentQuestionIndex - 1;
    this.currentSession.update(s => ({
      ...s!,
      currentQuestionIndex: prevIndex
    }));
    this.loadQuestion(prevIndex);
  }

  skipQuestion(): void {
      if (this.selectedMode() === SimulatorMode.PRACTICE) {
          this.nextQuestion();
      }
  }

  /**
   * Go back to mode selection
   */
  backToModeSelection(): void {
    this.stopTimer();
    this.currentState.set(SimulatorState.MODE_SELECTION);
    this.selectedMode.set(null);
    this.currentSession.set(null);
    this.currentQuestion.set(null);
  }
  
  /**
   * Update progress statistics
   */
  updateProgress(): void {
    const session = this.currentSession();
    if (!session) return;
    
    const completed = session.answers.length;
    const total = session.questions.length;
    const avgTime = completed > 0 
      ? session.answers.reduce((sum, a) => sum + a.timeSpent, 0) / completed 
      : 0;
    const totalScore = completed > 0
      ? session.answers.reduce((sum, a) => sum + (a.score || 0), 0) / completed
      : 0;
    
    this.progress.set({
      questionsCompleted: completed,
      totalQuestions: total,
      averageTimePerQuestion: avgTime,
      currentScore: Math.round(totalScore),
      progressPercentage: Math.round((completed / total) * 100)
    });
  }
  
  /**
   * Complete the simulation
   */
  completeSimulation(): void {
    this.stopTimer();
    const session = this.currentSession();
    if (!session) return;

    this.currentSession.update(s => ({
      ...s!,
      status: 'completed',
      endTime: new Date().toISOString()
    }));

    // Calculate final results
    const total = session.answers.length;
    const correct = session.answers.filter(a => (a.score || 0) >= 70).length;
    const wrong = total - correct;
    const finalScore = total > 0 ? Math.round(session.answers.reduce((acc, a) => acc + (a.score || 0), 0) / total) : 0;

    this.simulationScore.set(finalScore);
    this.correctAnswersCount.set(correct);
    this.wrongAnswersCount.set(wrong);
    
    // Generate AI Feedback Summary
    if (finalScore >= 80) {
      this.aiFeedbackSummary.set("Excellent technical mastery and communication. You are ready for the real interview.");
    } else if (finalScore >= 60) {
      this.aiFeedbackSummary.set("Good technical foundation, but work on structuring your answers and managing your time better.");
    } else {
      this.aiFeedbackSummary.set("Keep practicing. Focus on the fundamentals and try to be more precise in your explanations.");
    }

    this.showResultModal.set(true);
  }

  restartSimulation(): void {
    this.showResultModal.set(false);
    this.currentState.set(SimulatorState.MODE_SELECTION);
    this.selectedMode.set(null);
  }
  
  /**
   * Navigate to dashboard
   */
  navigateToDashboard(): void {
    this.router.navigate(['/user/dashboard']);
  }
  
  /**
   * Toggle voice recording (for future feature)
   */
  toggleRecording(): void {
    this.isRecording.update(r => !r);
    // TODO: Implement voice recording
  }
  
  /**
   * Format time display
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get time display color based on remaining time (Assistant Mode)
   */
  getTimeColor(): string {
    const remaining = this.timeRemaining();
    const limit = this.questionTimeLimit();
    const percentage = (remaining / limit) * 100;
    
    if (percentage > 50) return 'text-emerald-500';
    if (percentage > 25) return 'text-amber-500';
    return 'text-rose-500';
  }
  
  /**
   * Simulate AI feedback (replace with actual API)
   */
  private simulateAIFeedback(answer: UserAnswer, question: InterviewQuestion): void {
    if (question.options) {
        // MCQ Logic
        const isCorrect = answer.selectedOptionIndex === question.correctOptionIndex;
        answer.score = isCorrect ? 100 : 0;
        answer.feedback = isCorrect 
            ? "Great job! This is the most optimal solution because it directly addresses the problem constraints." 
            : `Not quite. The correct answer was option ${String.fromCharCode(65 + (question.correctOptionIndex || 0))}. Consider reviewing the core concepts related to this topic.`;
    } else {
        // Text Answer Logic
        answer.score = Math.floor(Math.random() * 30) + 70; // 70-100
        answer.feedback = "Good answer! You demonstrated understanding of the concept. Consider adding more specific examples from your experience and mentioning corner cases.";
    }
  }
  
  /**
   * Sample questions for testing
   */
  private readonly sampleQuestions: InterviewQuestion[] = [
    {
      id: 'q1',
      question: 'Which protocol allows the client to specify the exact structure of the data returned from the server, preventing over-fetching?',
      category: 'technical',
      difficulty: 'medium',
      expectedDuration: 60,
      options: ['REST API', 'GraphQL', 'SOAP', 'gRPC'],
      correctOptionIndex: 1,
      codeSnippet: {
          language: 'graphql',
          code: `// Query Example
query {
  user(id: "123") {
    name
    email
  }
}`
      }
    },
    {
      id: 'q2',
      question: 'Explain the concept of closures in JavaScript and provide a practical use case.',
      category: 'technical',
      difficulty: 'medium',
      expectedDuration: 180,
      keyPoints: ['Scope', 'Function factory', 'Data privacy']
    },
    {
      id: 'q3',
      question: 'How would you optimize the performance of a large React application experiencing lag?',
      category: 'technical',
      difficulty: 'hard',
      expectedDuration: 300,
      keyPoints: ['Memoization', 'Code splitting', 'Virtual DOM', 'React.memo', 'useCallback']
    }
  ];

  // --- Saved Question Actions ---

  isQuestionSaved(id: string): boolean {
    return this.savedQuestionsService.isSaved(id);
  }

  toggleSave(q?: InterviewQuestion): void {
    const question = q || this.currentQuestion();
    if (!question) return;

    this.savedQuestionsService.toggleSave({
      id: question.id,
      question: question.question,
      answer: question.idealAnswer || "No answer available",
      topic: question.category,
      savedAt: new Date().toISOString(),
      isImportant: false
    });
  }

  toggleImportant(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.savedQuestionsService.toggleImportant(id);
  }

  unsaveQuestion(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.savedQuestionsService.unsaveQuestion(id);
  }

  viewSavedQuestion(q: SavedQuestion): void {
    this.selectedSavedQuestion.set(q);
    this.showSavedModal.set(true);
  }

  closeSavedModal(): void {
    this.showSavedModal.set(false);
    this.selectedSavedQuestion.set(null);
  }

  nextSavedQuestion(): void {
    const current = this.selectedSavedQuestion();
    const questions = this.savedQuestions();
    if (!current || questions.length <= 1) return;

    const currentIndex = questions.findIndex(q => q.id === current.id);
    const nextIndex = (currentIndex + 1) % questions.length;
    this.selectedSavedQuestion.set(questions[nextIndex]);
  }

  toggleSortedSaved(): void {
    this.savedQuestionsSort.update(s => s === 'date' ? 'importance' : 'date');
    this.savedQuestionsPage.set(1);
  }

  setSavedPage(page: number): void {
    this.savedQuestionsPage.set(page);
  }
}
