import { Injectable, effect, inject, signal, computed } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'theme-preference';
  /** Sync with @omnedia/ngx-theme-toggle which uses 'theme' */
  private readonly LIBRARY_THEME_KEY = 'theme';
  private doc = inject(DOCUMENT);
  private themeSignal = signal<Theme>(this.getInitialTheme());

  public theme$ = this.themeSignal.asReadonly();

  constructor() {
    // Apply theme changes to DOM
    effect(() => {
      const theme = this.themeSignal();
      this.applyTheme(theme);
      localStorage.setItem(this.THEME_KEY, theme);
      localStorage.setItem(this.LIBRARY_THEME_KEY, theme);
    });
    this.observeDomTheme();
  }

  /**
   * When ngx-theme-toggle (or any code) toggles the theme class on the document,
   * sync our signal and localStorage so ThemeService stays the source of truth.
   */
  private observeDomTheme(): void {
    if (typeof this.doc?.documentElement?.classList?.add !== 'function') return;
    const html = this.doc.documentElement;
    const observer = new MutationObserver(() => {
      const isDark = html.classList.contains('dark');
      const isLight = html.classList.contains('light');
      const next: Theme = isDark ? 'dark' : 'light';
      if (next !== this.themeSignal()) {
        this.themeSignal.set(next);
        localStorage.setItem(this.THEME_KEY, next);
        localStorage.setItem(this.LIBRARY_THEME_KEY, next);
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  }

  /**
   * Get the initial theme from localStorage or system preference
   */
  private getInitialTheme(): Theme {
    const storedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;

    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.themeSignal();
  }

  /**
   * Toggle theme between light and dark
   */
  toggleTheme(): void {
    const currentTheme = this.themeSignal();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Use View Transitions API for smooth animation
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        this.themeSignal.set(newTheme);
      });
    } else {
      // Fallback for browsers that don't support View Transitions
      this.themeSignal.set(newTheme);
    }
  }

  /**
   * Set theme to specific value
   */
  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    const htmlElement = this.doc.documentElement;
    if (!htmlElement) return;

    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
    } else {
      htmlElement.classList.add('light');
      htmlElement.classList.remove('dark');
    }
  }

  /**
   * Check if dark mode is currently enabled
   */
  isDarkMode = computed(() => this.themeSignal() === 'dark');
}
