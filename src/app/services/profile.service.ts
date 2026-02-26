import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  avatarUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  bio: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  // Use a signal for reactive state management
  private userProfile = signal<UserProfile | null>(null);

  // Public getter for the signal
  public readonly userProfile$ = this.userProfile.asReadonly();

  constructor() {
    // Initialize with some default or fetched data
    // For now, I'll use a placeholder.
    this.userProfile.set({
      avatarUrl: 'assets/default-profile-pic.png',
      firstName: 'user',
      lastName: '',
      email: 'user@example.com', // Placeholder for "email used in sign up process"
      location: '',
      bio: ''
    });
  }

  // Method to update the entire profile
  setUserProfile(profile: UserProfile) {
    this.userProfile.set(profile);
  }

  // Method to specifically update the avatar URL
  updateAvatar(newAvatarUrl: string) {
    this.userProfile.update(profile => {
      if (profile) {
        return { ...profile, avatarUrl: newAvatarUrl };
      }
      return null;
    });
  }
}
