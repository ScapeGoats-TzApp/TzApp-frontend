import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfilePictureService } from '../../services/profile-picture.service';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.scss'
})
export class LoadingScreen implements OnInit {
  selectedProfilePic = 'profile1.jpg'; // Default photo
  userName = 'Tzapul';

  constructor(public profilePictureService: ProfilePictureService) {}

  ngOnInit(): void {
    // Load user name from localStorage
    const savedName = localStorage.getItem('tzapp-user-name');
    if (savedName) {
      this.userName = savedName;
    }
    
    // Load selected profile picture from service
    this.selectedProfilePic = this.profilePictureService.getSelectedProfilePic()();
    
    // Debug: Log the profile picture path
    console.log('Profile picture path:', this.profilePictureService.getProfilePicPath());
    console.log('Selected profile pic:', this.selectedProfilePic);
  }

  getProfilePicPath(): string {
    return this.profilePictureService.getProfilePicPath();
  }
}
