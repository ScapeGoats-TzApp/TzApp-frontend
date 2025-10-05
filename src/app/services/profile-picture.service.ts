import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProfilePictureService {
  private selectedProfilePic = signal('profile1.jpg'); // Default photo
  
  constructor() {
    // Load profile picture from localStorage on service initialization
    this.loadProfilePicture();
  }

  getSelectedProfilePic() {
    return this.selectedProfilePic.asReadonly();
  }

  setSelectedProfilePic(picName: string) {
    this.selectedProfilePic.set(picName);
    localStorage.setItem('tzapp-profile-pic', picName);
  }

  getProfilePicPath(picName?: string): string {
    const pic = picName || this.selectedProfilePic();
    return `assets/profile_pics/${pic}`;
  }

  private loadProfilePicture(): void {
    const savedProfilePic = localStorage.getItem('tzapp-profile-pic');
    if (savedProfilePic) {
      this.selectedProfilePic.set(savedProfilePic);
    }
  }
}
