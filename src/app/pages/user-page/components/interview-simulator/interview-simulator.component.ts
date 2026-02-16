
import { Component, OnInit, OnDestroy, signal, computed, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  // State management
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
  
  constructor(private router: Router) {}

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
    // Auto-submit current answer or mark as skipped if empty
    // If it's an MCQ and nothing selected, we skip/fail
    // If text answer and non-empty, we submit
    const currentQ = this.currentQuestion();
    if (!currentQ) return; 

    if (currentQ.options) {
        if (this.selectedOption() !== null) {
            this.submitAnswer();
        } else {
            // Auto submit as wrong/skipped
             alert("Time expired! Moving to next question.");
             this.nextQuestion();
        }
    } else {
         if (this.currentAnswer().trim().length > 0) {
            this.submitAnswer();
         } else {
             alert("Time expired! Moving to next question.");
             this.nextQuestion();
         }
    }
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
    this.currentSession.update(s => ({
      ...s!,
      status: 'completed',
      endTime: new Date().toISOString()
    }));
    // Show completion modal or redirect
    alert('Simulation Completed! Review your results on the dashboard.');
    this.navigateToDashboard();
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
}
