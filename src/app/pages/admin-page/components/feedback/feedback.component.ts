import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Data Interfaces
interface FeedbackItem {
  id: string;
  title: string;
  message: string;
  userName: string;
  userEmail: string;
  userInitials: string;
  priority: 'high' | 'medium' | 'low';
  type: 'bug' | 'feature' | 'general';
  timestamp: string;
  status: 'pending' | 'replied' | 'resolved';
  attachment?: string;
  selected?: boolean;
}

interface FilterOptions {
  type: string; // 'all', 'bug', 'feature'
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FeedbackComponent {
  // Feedback Items Data Array
  feedbackItems: FeedbackItem[] = [
    {
      id: '#92841',
      title: 'PDF Parsing error in technical CV',
      message: 'I tried uploading my resume as a PDF but it says it\'s not readable. This is very frustrating as I have a deadline...',
      userName: 'Ina Perry',
      userEmail: 'ina.perry@example.com',
      userInitials: 'IE',
      priority: 'high',
      type: 'bug',
      timestamp: '2m ago',
      status: 'pending',
      attachment: 'ina_perry_resume_2024.pdf'
    },
    {
      id: '#92840',
      title: 'Suggestion: Dark mode support',
      message: 'It would be awesome if the platform supported dark mode. I usually do my applications late at night.',
      userName: 'Wesley Ray',
      userEmail: 'wesley.r@example.com',
      userInitials: 'WR',
      priority: 'medium',
      type: 'feature',
      timestamp: '14m ago',
      status: 'pending'
    },
    {
      id: '#92839',
      title: 'CV score seems inaccurate',
      message: 'My CV score is showing 45 but I have 10 years of experience. Can you check if the algorithm is working correctly?',
      userName: 'Sarah Chen',
      userEmail: 'sarah.c@example.com',
      userInitials: 'SC',
      priority: 'medium',
      type: 'bug',
      timestamp: '1h ago',
      status: 'replied'
    },
    {
      id: '#92838',
      title: 'Feature Request: LinkedIn Integration',
      message: 'Would love to see LinkedIn profile import to auto-fill CV data.',
      userName: 'Marcus Johnson',
      userEmail: 'marcus.j@example.com',
      userInitials: 'MJ',
      priority: 'low',
      type: 'feature',
      timestamp: '3h ago',
      status: 'pending'
    },
    {
      id: '#92837',
      title: 'Cannot download my CV analysis',
      message: 'The download button for the analysis report is not working. I get a 404 error.',
      userName: 'Emily Watson',
      userEmail: 'emily.w@example.com',
      userInitials: 'EW',
      priority: 'high',
      type: 'bug',
      timestamp: '5h ago',
      status: 'resolved'
    }
  ];

  // Filtered feedback items
  filteredFeedback: FeedbackItem[] = [];
  selectedFeedback: FeedbackItem | null = null;

  // Filter Options
  filters: FilterOptions = {
    type: 'all'
  };

  // Reply text
  replyText: string = '';

  constructor() {
    this.applyFilters();
    // Select first item by default
    if (this.filteredFeedback.length > 0) {
      this.selectFeedback(this.filteredFeedback[0]);
    }
  }

  // CRUD Operations

  /**
   * Add a new feedback item
   */
  addFeedback(feedback: FeedbackItem): void {
    this.feedbackItems.unshift(feedback);
    this.applyFilters();
    console.log('Feedback added:', feedback);
  }

  /**
   * Update an existing feedback item by ID
   */
  updateFeedback(feedbackId: string, updatedData: Partial<FeedbackItem>): void {
    const index = this.feedbackItems.findIndex(f => f.id === feedbackId);
    if (index !== -1) {
      this.feedbackItems[index] = { ...this.feedbackItems[index], ...updatedData };
      this.applyFilters();
      console.log('Feedback updated:', this.feedbackItems[index]);
    }
  }

  /**
   * Delete a feedback item by ID
   */
  deleteFeedback(feedbackId: string): void {
    const index = this.feedbackItems.findIndex(f => f.id === feedbackId);
    if (index !== -1) {
      const deletedFeedback = this.feedbackItems.splice(index, 1)[0];
      this.applyFilters();
      console.log('Feedback deleted:', deletedFeedback);
    }
  }

  /**
   * Get a feedback item by ID
   */
  getFeedbackById(feedbackId: string): FeedbackItem | undefined {
    return this.feedbackItems.find(f => f.id === feedbackId);
  }

  /**
   * Mark feedback as replied
   */
  markAsReplied(feedbackId: string): void {
    const feedback = this.getFeedbackById(feedbackId);
    if (feedback && feedback.status === 'pending') {
      feedback.status = 'replied';
      this.applyFilters();
      console.log('Feedback marked as replied:', feedback);
    }
  }

  // Filtering

  /**
   * Apply type filter
   */
  applyFilters(): void {
    let result = [...this.feedbackItems];

    // Type filter
    if (this.filters.type !== 'all') {
      result = result.filter(feedback => feedback.type === this.filters.type);
    }

    this.filteredFeedback = result;
  }

  /**
   * Set filter type
   */
  setFilterType(type: string): void {
    this.filters.type = type;
    this.applyFilters();
  }

  // Selection

  /**
   * Select a feedback item to view details
   */
  selectFeedback(feedback: FeedbackItem): void {
    this.selectedFeedback = feedback;
  }

  /**
   * Check if feedback is selected
   */
  isSelected(feedback: FeedbackItem): boolean {
    return this.selectedFeedback?.id === feedback.id;
  }

  // UI Helpers

  /**
   * Get priority badge color class
   */
  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]';
      case 'medium':
        return 'bg-purple-500/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.2)]';
      case 'low':
        return 'bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  }

  /**
   * Get type badge color class
   */
  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'bug':
        return 'bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
      case 'feature':
        return 'bg-purple-500/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'general':
        return 'bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  }

  /**
   * Get type icon
   */
  getTypeIcon(type: string): string {
    switch (type) {
      case 'bug': return 'bug_report';
      case 'feature': return 'lightbulb';
      case 'general': return 'chat';
      default: return 'feedback';
    }
  }

  /**
   * Get type dot color
   */
  getTypeDotColor(type: string): string {
    switch (type) {
      case 'bug': return 'bg-red-400';
      case 'feature': return 'bg-purple-400';
      case 'general': return 'bg-blue-400';
      default: return 'bg-slate-400';
    }
  }

  /**
   * Handle send reply
   */
  onSendReply(): void {
    if (this.selectedFeedback && this.replyText.trim()) {
      console.log('Sending reply to:', this.selectedFeedback.id);
      console.log('Reply text:', this.replyText);

      this.markAsReplied(this.selectedFeedback.id);
      this.replyText = '';
    }
  }

  /**
   * Handle refresh
   */
  onRefresh(): void {
    console.log('Refreshing feedback list...');
    this.applyFilters();
  }
}
