import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  goatImageUrl: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private readonly USER_PROFILE_KEY = 'userProfile';
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);

  // Default goat images available for selection
  public readonly availableGoatImages = [
    {
      id: 'default',
      url: 'https://api.builder.io/api/v1/image/assets/TEMP/70d690321e018ce2d4950ed60a712bea69803968?width=381',
      name: 'Default Goat'
    },
    {
      id: 'skiing',
      url: 'https://api.builder.io/api/v1/image/assets/TEMP/69135c87e725cbe79abd4f7d8a33ec4cdd5b4437?width=284',
      name: 'Skiing Goat'
    },
    {
      id: 'mascot',
      url: 'https://api.builder.io/api/v1/image/assets/TEMP/ba9f7d67248554e5479eb4ce837c2552328cd99d?width=514',
      name: 'Mascot Goat'
    },
    {
      id: 'saved',
      url: 'https://api.builder.io/api/v1/image/assets/TEMP/85335c987e9ae8ac6b1b4c944aca2140d49c0e3a?width=228',
      name: 'Saved Goat'
    }
  ];

  constructor() {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    try {
      const saved = localStorage.getItem(this.USER_PROFILE_KEY);
      if (saved) {
        const profile: UserProfile = JSON.parse(saved);
        // Convert createdAt back to Date object
        profile.createdAt = new Date(profile.createdAt);
        this.userProfileSubject.next(profile);
      } else {
        // Create default profile if none exists
        this.createDefaultProfile();
      }
    } catch (error) {
      console.warn('Failed to load user profile:', error);
      this.createDefaultProfile();
    }
  }

  private createDefaultProfile(): void {
    const defaultProfile: UserProfile = {
      id: 'default_user',
      name: 'AmpuLaMare',
      goatImageUrl: this.availableGoatImages[0].url,
      createdAt: new Date()
    };
    this.saveUserProfile(defaultProfile);
  }

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
      this.userProfileSubject.next(profile);
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  updateGoatImage(goatImageUrl: string): void {
    const currentProfile = this.userProfileSubject.value;
    if (currentProfile) {
      const updatedProfile: UserProfile = {
        ...currentProfile,
        goatImageUrl
      };
      this.saveUserProfile(updatedProfile);
    }
  }

  updateUserName(name: string): void {
    const currentProfile = this.userProfileSubject.value;
    if (currentProfile) {
      const updatedProfile: UserProfile = {
        ...currentProfile,
        name
      };
      this.saveUserProfile(updatedProfile);
    }
  }

  getUserProfile(): Observable<UserProfile | null> {
    return this.userProfileSubject.asObservable();
  }

  getCurrentUserProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  getCurrentGoatImageUrl(): string {
    const profile = this.getCurrentUserProfile();
    return profile?.goatImageUrl || this.availableGoatImages[0].url;
  }
}
