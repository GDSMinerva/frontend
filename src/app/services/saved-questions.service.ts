
import { Injectable, signal, computed } from '@angular/core';

export interface SavedQuestion {
  id: string;
  question: string;
  answer: string;
  topic: string;
  savedAt: string;
  isImportant: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SavedQuestionsService {
  private readonly STORAGE_KEY = 'interview_saved_questions';
  
  // State signal
  private savedQuestionsSignal = signal<SavedQuestion[]>([]);
  
  // Public signal for components
  savedQuestions = computed(() => this.savedQuestionsSignal());

  constructor() {
    this.loadFromStorage();
  }

  toggleSave(question: SavedQuestion): void {
    const current = this.savedQuestionsSignal();
    const index = current.findIndex(q => q.id === question.id);
    
    if (index > -1) {
      this.unsaveQuestion(question.id);
    } else {
      this.saveQuestion(question);
    }
  }

  saveQuestion(question: SavedQuestion): void {
    this.savedQuestionsSignal.update(qs => [...qs, { ...question, savedAt: new Date().toISOString() }]);
    this.saveToStorage();
  }

  unsaveQuestion(id: string): void {
    this.savedQuestionsSignal.update(qs => qs.filter(q => q.id !== id));
    this.saveToStorage();
  }

  toggleImportant(id: string): void {
    this.savedQuestionsSignal.update(qs => 
      qs.map(q => q.id === id ? { ...q, isImportant: !q.isImportant } : q)
    );
    this.saveToStorage();
  }

  isSaved(id: string): boolean {
    return this.savedQuestionsSignal().some(q => q.id === id);
  }

  getSavedQuestion(id: string): SavedQuestion | undefined {
    return this.savedQuestionsSignal().find(q => q.id === id);
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.savedQuestionsSignal.set(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved questions from localStorage', e);
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.savedQuestionsSignal()));
  }
}
