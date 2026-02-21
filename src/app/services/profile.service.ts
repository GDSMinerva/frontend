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
      avatarUrl: 'assets/images/default-avatar.png', // A default placeholder
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      location: 'City, Country',
      bio: 'Your bio goes here.'
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
