import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Data Interfaces
interface User {
  id: string;
  fullName: string;
  email: string;
  cvScore: number;
  lastLogin: string;
  registrationDate: string;
  initials: string;
  avatarColor: string;
  status: 'active' | 'suspended' | 'pending';
  selected?: boolean;
}

interface FilterOptions {
  searchQuery: string;
  registrationDate: string;
  lastLogin: string;
  cvScoreRange: string;
}

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserManagementComponent {
  // Expose Math to template
  Math = Math;

  // User Data Array (matching Stitch template data)
  users: User[] = [
    { id: 'ID-9421', fullName: 'Alex Shepherd', email: 'alex.s@example.com', cvScore: 85, lastLogin: '2 mins ago', registrationDate: '2024-01-15', initials: 'AS', avatarColor: 'from-blue-100 to-indigo-100 text-indigo-700', status: 'active' },
    { id: 'ID-8842', fullName: 'Maria Kross', email: 'maria.k@cvscan.io', cvScore: 62, lastLogin: 'Yesterday', registrationDate: '2024-01-10', initials: 'MK', avatarColor: 'from-indigo-50 to-indigo-100 text-indigo-600', status: 'suspended' },
    { id: 'ID-7215', fullName: 'John Doe', email: 'john.doe@gmail.com', cvScore: 91, lastLogin: '12 Oct 2023', registrationDate: '2023-10-01', initials: 'JD', avatarColor: 'from-slate-100 to-slate-200 text-slate-600', status: 'pending' },
    { id: 'ID-4412', fullName: 'Lucy Wang', email: 'lwang@tech.co', cvScore: 28, lastLogin: '3 hours ago', registrationDate: '2024-02-01', initials: 'LW', avatarColor: 'from-teal-50 to-teal-100 text-teal-600', status: 'active' },
    { id: 'ID-3391', fullName: 'Robert Miller', email: 'r.miller@example.com', cvScore: 55, lastLogin: '5 hours ago', registrationDate: '2024-01-20', initials: 'RM', avatarColor: 'from-orange-50 to-orange-100 text-orange-600', status: 'active' },
    { id: 'ID-2284', fullName: 'Sarah Chen', email: 'sarah.c@design.io', cvScore: 76, lastLogin: '1 day ago', registrationDate: '2024-01-25', initials: 'SC', avatarColor: 'from-purple-50 to-purple-100 text-purple-600', status: 'active' },
    { id: 'ID-1152', fullName: 'Michael Tan', email: 'mtan@service.net', cvScore: 15, lastLogin: '2 days ago', registrationDate: '2023-12-15', initials: 'MT', avatarColor: 'from-rose-50 to-rose-100 text-rose-600', status: 'suspended' },
    { id: 'ID-0098', fullName: 'Emma Watson', email: 'emma.w@global.com', cvScore: 88, lastLogin: '3 days ago', registrationDate: '2024-01-05', initials: 'EW', avatarColor: 'from-amber-50 to-amber-100 text-amber-600', status: 'active' },
    { id: 'ID-5561', fullName: 'David Park', email: 'd.park@creative.co', cvScore: 45, lastLogin: '5 days ago', registrationDate: '2023-11-20', initials: 'DP', avatarColor: 'from-emerald-50 to-emerald-100 text-emerald-600', status: 'pending' },
    { id: 'ID-8810', fullName: 'Kevin Foster', email: 'k.foster@domain.com', cvScore: 92, lastLogin: '1 week ago', registrationDate: '2023-11-10', initials: 'KF', avatarColor: 'from-cyan-50 to-cyan-100 text-cyan-600', status: 'active' }
  ];

  // Filtered and paginated users
  filteredUsers: User[] = [];
  displayedUsers: User[] = [];

  // Filter Options
  filters: FilterOptions = {
    searchQuery: '',
    registrationDate: '',
    lastLogin: '',
    cvScoreRange: ''
  };

  // Pagination State
  pagination: PaginationState = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1
  };

  // Bulk selection
  selectAll: boolean = false;

  constructor() {
    this.applyFilters();
  }

  // CRUD Operations

  /**
   * Add a new user to the users array
   * In a real application, this would make an API call
   */
  addUser(user: User): void {
    this.users.unshift(user);
    this.applyFilters();
    console.log('User added:', user);
  }

  /**
   * Update an existing user by ID
   */
  updateUser(userId: string, updatedData: Partial<User>): void {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updatedData };
      this.applyFilters();
      console.log('User updated:', this.users[index]);
    }
  }

  /**
   * Delete a user by ID
   */
  deleteUser(userId: string): void {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      const deletedUser = this.users.splice(index, 1)[0];
      this.applyFilters();
      console.log('User deleted:', deletedUser);
    }
  }

  /**
   * Get a user by ID
   */
  getUserById(userId: string): User | undefined {
    return this.users.find(u => u.id === userId);
  }

  /**
   * Suspend a user account
   */
  suspendUser(userId: string): void {
    const user = this.getUserById(userId);
    if (user && user.status !== 'suspended') {
      user.status = 'suspended';
      this.applyFilters();
      console.log('User suspended:', user);
    }
  }

  /**
   * Unsuspend (activate) a user account
   */
  unsuspendUser(userId: string): void {
    const user = this.getUserById(userId);
    if (user && user.status === 'suspended') {
      user.status = 'active';
      this.applyFilters();
      console.log('User unsuspended:', user);
    }
  }

  // Filtering & Search

  /**
   * Apply all active filters and update displayed users
   */
  applyFilters(): void {
    let result = [...this.users];

    // Search filter (name or email)
    if (this.filters.searchQuery.trim()) {
      const query = this.filters.searchQuery.toLowerCase();
      result = result.filter(user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // Registration date filter
    if (this.filters.registrationDate) {
      const now = new Date();
      result = result.filter(user => {
        const regDate = new Date(user.registrationDate);
        const diffTime = Math.abs(now.getTime() - regDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (this.filters.registrationDate) {
          case '24h': return diffDays <= 1;
          case 'week': return diffDays <= 7;
          case 'custom': return true; // Would open date picker in real app
          default: return true;
        }
      });
    }

    // CV Score range filter
    if (this.filters.cvScoreRange) {
      result = result.filter(user => {
        switch (this.filters.cvScoreRange) {
          case 'low': return user.cvScore >= 0 && user.cvScore <= 30;
          case 'mid': return user.cvScore >= 31 && user.cvScore <= 70;
          case 'high': return user.cvScore >= 71 && user.cvScore <= 100;
          default: return true;
        }
      });
    }

    this.filteredUsers = result;
    this.updatePagination();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {
      searchQuery: '',
      registrationDate: '',
      lastLogin: '',
      cvScoreRange: ''
    };
    this.applyFilters();
  }

  // Pagination

  /**
   * Update pagination state and displayed users
   */
  updatePagination(): void {
    this.pagination.totalItems = this.filteredUsers.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);

    // Ensure current page is valid
    if (this.pagination.currentPage > this.pagination.totalPages) {
      this.pagination.currentPage = Math.max(1, this.pagination.totalPages);
    }

    // Calculate displayed users
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const endIndex = startIndex + this.pagination.itemsPerPage;
    this.displayedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  /**
   * Change to a specific page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Get array of page numbers for pagination controls
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagination.totalPages;
    const currentPage = this.pagination.currentPage;

    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and nearby pages
      pages.push(1);
      if (currentPage > 3) pages.push(-1); // -1 represents ellipsis

      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push(-1);
      pages.push(totalPages);
    }

    return pages;
  }

  // Bulk Actions

  /**
   * Toggle select all users
   */
  toggleSelectAll(): void {
    this.displayedUsers.forEach(user => user.selected = this.selectAll);
  }

  /**
   * Get count of selected users
   */
  getSelectedCount(): number {
    return this.users.filter(u => u.selected).length;
  }

  /**
   * Delete all selected users
   */
  bulkDelete(): void {
    const selectedIds = this.users.filter(u => u.selected).map(u => u.id);
    selectedIds.forEach(id => this.deleteUser(id));
    this.selectAll = false;
  }

  /**
   * Export selected users (placeholder)
   */
  bulkExport(): void {
    const selectedUsers = this.users.filter(u => u.selected);
    console.log('Exporting users:', selectedUsers);
    // In real app, would generate CSV/Excel file
  }

  // UI Helpers

  /**
   * Get CV score badge color class
   */
  getCvScoreBadgeClass(score: number): string {
    if (score >= 71) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (score >= 31) return 'bg-purple-50 text-purple-600 border-purple-100';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  }

  /**
   * Handle "Add New User" button click
   */
  onAddNewUser(): void {
    // In a real application, this would open a modal/form
    console.log('Add New User clicked - would open modal');

    // Example: Add a sample user
    const newUser: User = {
      id: `ID-${Math.floor(Math.random() * 10000)}`,
      fullName: 'New User',
      email: 'newuser@example.com',
      cvScore: 50,
      lastLogin: 'Just now',
      registrationDate: new Date().toISOString().split('T')[0],
      initials: 'NU',
      avatarColor: 'from-blue-100 to-indigo-100 text-indigo-700',
      status: 'active'
    };

    this.addUser(newUser);
  }
}
