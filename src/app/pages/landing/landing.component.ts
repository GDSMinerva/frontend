import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgxTypewriterComponent } from '@omnedia/ngx-typewriter';
import { NgxElectricBorderComponent } from '@omnedia/ngx-electric-border';
import { NgxMeteorsComponent } from '@omnedia/ngx-meteors';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxTypewriterComponent, NgxElectricBorderComponent, NgxMeteorsComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LandingComponent implements OnInit {
  currentYear = new Date().getFullYear();
  isDarkMode: boolean = false;
  isMobileMenuOpen: boolean = false;

  ngOnInit() {
    // Check system preference or localStorage on init
    const prefersDark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.isDarkMode = prefersDark;
    this.updateTheme();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.updateTheme();
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  private updateTheme() {
    const html = document.documentElement;
    if (this.isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}
