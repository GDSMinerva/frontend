import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// --- Interfaces ---

interface CVScanStatus {
  hasCompletedScan: boolean;
  cvId?: string;
  lastScanDate?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'cv-analysis' | 'job-matching' | 'billing' | 'technical';
  isExpanded: boolean;
  helpful?: number; // Vote count
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdDate: string;
  lastUpdated: string;
  category: string;
  assignedTo?: string;
  responses?: TicketResponse[];
}

interface TicketResponse {
  id: string;
  ticketId: string;
  message: string;
  from: 'user' | 'support';
  timestamp: string;
  attachments?: string[];
}

interface Feedback {
  id: string;
  rating: number; // 1-5 stars
  category: 'cv-analysis' | 'job-matches' | 'interview-sim' | 'courses' | 'general';
  comment: string;
  submittedDate: string;
  status: 'pending' | 'reviewed' | 'implemented';
}

interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  priority: 'normal' | 'urgent';
}

@Component({
  selector: 'app-support-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './support-feedback.component.html',
  styleUrl: './support-feedback.component.css'
})
export class SupportFeedbackComponent implements OnInit {
  
  // --- State Signals ---
  
  // CV scan status
  cvScanStatus = signal<CVScanStatus>({ hasCompletedScan: false });
  
  // FAQ data
  faqs = signal<FAQ[]>([]);
  faqSearchQuery = signal<string>('');
  selectedFaqCategory = signal<string>('all');
  
  // Support tickets
  supportTickets = signal<SupportTicket[]>([]);
  selectedTicket = signal<SupportTicket | null>(null);
  
  // Feedback data
  feedbackHistory = signal<Feedback[]>([]);
  
  // UI state
  isLoading = signal(false);
  showContactForm = signal(false);
  showFeedbackForm = signal(false);
  showTicketDetails = signal(false);
  isChatOpen = signal(false);
  actionError = signal<string | null>(null);

  private clearErrorAfterDelay(): void {
    setTimeout(() => this.actionError.set(null), 2000);
  }
  
  // Forms
  contactForm: FormGroup;
  feedbackForm: FormGroup;
  ticketReplyForm: FormGroup;
  
  // Filtered FAQs
  filteredFaqs = computed(() => {
    const faqs = this.faqs();
    const query = this.faqSearchQuery().toLowerCase();
    const category = this.selectedFaqCategory();
    
    let filtered = faqs;
    
    if (category !== 'all') {
      filtered = filtered.filter(f => f.category === category);
    }
    
    if (query) {
      filtered = filtered.filter(f => 
        f.question.toLowerCase().includes(query) || 
        f.answer.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  });
  
  // Sample data
  private readonly sampleFAQs: FAQ[] = [
    {
      id: 'faq-1',
      question: 'How does the CV analysis work?',
      answer: 'Our AI-powered CV analysis uses machine learning algorithms to evaluate your resume against job requirements, identify skill gaps, and provide personalized recommendations for improvement.',
      category: 'cv-analysis',
      isExpanded: false,
      helpful: 42
    },
    {
      id: 'faq-2',
      question: 'How accurate is the job matching?',
      answer: 'Our job matching algorithm achieves 85-92% accuracy by analyzing your skills, experience, and career goals against real job postings. Match scores above 80% indicate strong alignment.',
      category: 'job-matching',
      isExpanded: false,
      helpful: 38
    },
    {
      id: 'faq-3',
      question: 'Can I upload multiple CV versions?',
      answer: 'Yes! You can upload and manage multiple CV versions tailored for different roles. Mark one as primary for job matching, and compare scores across versions.',
      category: 'cv-analysis',
      isExpanded: false,
      helpful: 56
    },
    {
      id: 'faq-4',
      question: 'Is my data secure and private?',
      answer: 'Absolutely. We use enterprise-grade encryption, never share your data with third parties, and you can export or delete your data at any time from your profile settings.',
      category: 'general',
      isExpanded: false,
      helpful: 71
    },
    {
      id: 'faq-5',
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel anytime from Profile > Data & Privacy > Manage Subscription. Your access continues until the end of the current billing period.',
      category: 'billing',
      isExpanded: false,
      helpful: 29
    }
  ];
  
  private readonly sampleTickets: SupportTicket[] = [
    {
      id: 'ticket-001',
      subject: 'CV analysis not completing',
      message: 'My CV has been processing for over 30 minutes. Is this normal?',
      status: 'resolved',
      priority: 'medium',
      category: 'Technical',
      createdDate: '2024-02-10',
      lastUpdated: '2024-02-11',
      assignedTo: 'Support Team',
      responses: [
        {
          id: 'resp-1',
          ticketId: 'ticket-001',
          message: 'Thank you for contacting us. We\'ve identified and fixed the issue. Your CV has been processed successfully.',
          from: 'support',
          timestamp: '2024-02-11T10:30:00Z'
        }
      ]
    },
    {
      id: 'ticket-002',
      subject: 'Question about job matching algorithm',
      message: 'Can you explain how the match percentage is calculated?',
      status: 'open',
      priority: 'low',
      category: 'General',
      createdDate: '2024-02-14',
      lastUpdated: '2024-02-14'
    }
  ];
  
  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    // Initialize contact form
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      category: ['general', Validators.required],
      priority: ['normal'],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
    
    // Initialize feedback form
    this.feedbackForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1)]],
      category: ['general', Validators.required],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
    
    // Initialize ticket reply form
    this.ticketReplyForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(5)]]
    });
  }
  
  ngOnInit(): void {
    this.checkCVScanStatus();
  }
  
  /**
   * Check if user has completed CV scan
   */
  async checkCVScanStatus(): Promise<void> {
    this.isLoading.set(true);
    
    // TODO: Replace with actual API call
    // const status = await this.cvService.checkScanStatus();
    
    // For testing - set to true to see active state
    this.cvScanStatus.set({
      hasCompletedScan: true, // Change to false to see locked state
      cvId: 'cv-001',
      lastScanDate: '2024-02-15'
    });
    
    if (this.cvScanStatus().hasCompletedScan) {
      await this.loadSupportData();
    }
    
    this.isLoading.set(false);
  }
  
  /**
   * Load all support data
   */
  async loadSupportData(): Promise<void> {
    await Promise.all([
      this.fetchFAQs(),
      this.fetchSupportTickets(),
      this.fetchFeedbackHistory()
    ]);
  }
  
  /**
   * Fetch FAQs from API
   * TODO: Replace with actual API call
   */
  async fetchFAQs(): Promise<void> {
    // TODO: const faqs = await this.supportService.getFAQs();
    this.faqs.set(this.sampleFAQs);
  }
  
  /**
   * Fetch support tickets from API
   * TODO: Replace with actual API call
   */
  async fetchSupportTickets(): Promise<void> {
    // TODO: const tickets = await this.supportService.getTickets();
    this.supportTickets.set(this.sampleTickets);
  }
  
  /**
   * Fetch feedback history from API
   * TODO: Replace with actual API call
   */
  async fetchFeedbackHistory(): Promise<void> {
    // TODO: const feedback = await this.supportService.getFeedback();
    this.feedbackHistory.set([]);
  }
  
  // --- FAQ Methods ---
  
  toggleFAQ(faqId: string): void {
    this.faqs.update(faqs => 
      faqs.map(f => ({
        ...f,
        isExpanded: f.id === faqId ? !f.isExpanded : f.isExpanded
      }))
    );
  }
  
  markFAQHelpful(faqId: string): void {
    this.faqs.update(faqs => 
      faqs.map(f => 
        f.id === faqId ? { ...f, helpful: (f.helpful || 0) + 1 } : f
      )
    );
    
    // TODO: Send to API
    // this.supportService.voteFAQ(faqId, 'helpful');
  }
  
  updateFaqSearch(query: string): void {
    this.faqSearchQuery.set(query);
  }
  
  filterFaqByCategory(category: string): void {
    this.selectedFaqCategory.set(category);
  }
  
  // --- Contact Form Methods ---
  
  toggleContactForm(): void {
    this.showContactForm.update(show => !show);
    if (this.showContactForm()) {
      this.contactForm.reset({ category: 'general', priority: 'normal' });
    }
  }
  
  async submitContactForm(): Promise<void> {
    if (this.contactForm.invalid) return;
    
    this.isLoading.set(true);
    
    const formData: ContactMessage = this.contactForm.value;
    
    // Simulate API call failure
    if (Math.random() < 0.1) {
      setTimeout(() => {
        this.actionError.set('Ticket creation failed. Network timeout.');
        this.clearErrorAfterDelay();
        this.isLoading.set(false);
      }, 1000);
      return;
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create ticket from contact form
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      subject: formData.subject,
      message: formData.message,
      status: 'open',
      priority: formData.priority === 'urgent' ? 'high' : 'medium',
      category: formData.category,
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    this.supportTickets.update(tickets => [newTicket, ...tickets]);
    
    this.isLoading.set(false);
    this.showContactForm.set(false);
    alert('Your message has been sent! We\'ll respond within 24 hours.');
  }
  
  // --- Feedback Form Methods ---
  
  toggleFeedbackForm(): void {
    this.showFeedbackForm.update(show => !show);
    if (this.showFeedbackForm()) {
      this.feedbackForm.reset({ rating: 0, category: 'general' });
    }
  }
  
  setRating(rating: number): void {
    this.feedbackForm.patchValue({ rating });
  }
  
  async submitFeedback(): Promise<void> {
    if (this.feedbackForm.invalid) return;
    
    this.isLoading.set(true);
    
    const formData = this.feedbackForm.value;
    
    // Simulate API call failure
    if (Math.random() < 0.1) {
      setTimeout(() => {
        this.actionError.set('Neural feedback service unavailable.');
        this.clearErrorAfterDelay();
        this.isLoading.set(false);
      }, 800);
      return;
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newFeedback: Feedback = {
      id: `feedback-${Date.now()}`,
      rating: formData.rating,
      category: formData.category,
      comment: formData.comment,
      submittedDate: new Date().toISOString(),
      status: 'pending'
    };
    
    this.feedbackHistory.update(history => [newFeedback, ...history]);
    
    this.isLoading.set(false);
    this.showFeedbackForm.set(false);
    alert('Thank you for your feedback!');
  }
  
  // --- Ticket Methods ---
  
  viewTicketDetails(ticket: SupportTicket): void {
    this.selectedTicket.set(ticket);
    this.showTicketDetails.set(true);
  }
  
  closeTicketDetails(): void {
    this.showTicketDetails.set(false);
    this.selectedTicket.set(null);
  }
  
  async replyToTicket(): Promise<void> {
    if (this.ticketReplyForm.invalid || !this.selectedTicket()) return;
    
    this.isLoading.set(true);
    
    const message = this.ticketReplyForm.value.message;
    const ticket = this.selectedTicket()!;
    
    const newResponse: TicketResponse = {
      id: `resp-${Date.now()}`,
      ticketId: ticket.id,
      message,
      from: 'user',
      timestamp: new Date().toISOString()
    };
    
    // Simulate API call failure
    if (Math.random() < 0.1) {
      setTimeout(() => {
        this.actionError.set('Sync failed. Please resend message.');
        this.clearErrorAfterDelay();
        this.isLoading.set(false);
      }, 1200);
      return;
    }
    
    // Update ticket
    this.supportTickets.update(tickets =>
      tickets.map(t =>
        t.id === ticket.id
          ? {
              ...t,
              responses: [...(t.responses || []), newResponse],
              lastUpdated: new Date().toISOString().split('T')[0],
              status: 'in-progress' as const
            }
          : t
      )
    );
    
    this.selectedTicket.update(t => ({
      ...t!,
      responses: [...(t!.responses || []), newResponse]
    }));
    
    this.ticketReplyForm.reset();
    this.isLoading.set(false);
  }
  
  // --- Live Chat Methods ---
  
  toggleChat(): void {
    this.isChatOpen.update(open => !open);
  }
  
  // --- Navigation ---
  
  navigateToDashboard(): void {
    this.router.navigate(['/user/dashboard']);
  }
}
