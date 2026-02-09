import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl.replace('/auth', '/users'); // Assuming /api/users
  private useMock = environment.mockApi;

  /**
   * Get user profile
   * Uses mock data if environment.mockApi is true
   */
  getProfile(userId: string): Observable<UserProfile> {
    if (this.useMock) {
      return this.getMockProfile(userId);
    }
    return this.http.get<UserProfile>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Update user profile
   */
  updateProfile(userId: string, data: Partial<UserProfile>): Observable<UserProfile> {
    if (this.useMock) {
      return this.updateMockProfile(userId, data);
    }
    return this.http.put<UserProfile>(`${this.apiUrl}/${userId}`, data);
  }

  // --- Mock Data Implementation ---

  // --- Mock Data Implementation ---

  /**
   * Mock implementation of getProfile.
   * In a real app with the MockApiInterceptor, this might not even be hit if
   * the interceptor catches the HTTP request. However, if we want to bypass HTTP
   * completely for this service method, we can do it here.
   */
  private getMockProfile(userId: string): Observable<UserProfile> {
    // Simulate network latency with a timer
    return timer(800).pipe(
      map(() => {
        // Try to find the user in localStorage first (added for consistency with registration)
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const storedUser = users.find((u: any) => u.id.toString() === userId.toString());

        if (storedUser) {
           return storedUser as UserProfile;
        }

        // Fallback static data if user not found in local storage
        const mockUser: UserProfile = {
          id: userId,
          firstName: 'Mock',
          lastName: 'User',
          email: 'mock.user@example.com',
          role: 'user',
          bio: 'This is a mock profile loaded from the client-side service.'
        };
        return mockUser;
      })
    );
  }

  private updateMockProfile(userId: string, data: Partial<UserProfile>): Observable<UserProfile> {
    return timer(1000).pipe(
      map(() => {
        // Update user in localStorage if valid
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex((u: any) => u.id.toString() === userId.toString());
        
        if (index !== -1) {
            users[index] = { ...users[index], ...data };
            localStorage.setItem('users', JSON.stringify(users));
            return users[index] as UserProfile;
        }

        // Fallback for static mock
        return {
          id: userId,
          firstName: data.firstName || 'Mock',
          lastName: data.lastName || 'User',
          email: 'mock.user@example.com',
          role: 'user',
          bio: data.bio || 'Updated bio'
        } as UserProfile;
      })
    );
  }
}
