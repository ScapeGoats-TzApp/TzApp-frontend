import { Component, signal, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationComponent } from '../../components/navigation';
import { ProfilePictureService } from '../../services/profile-picture.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NavigationComponent],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.scss'
})
export class MyProfile implements OnInit {
  @ViewChild('nameInput', { static: false }) nameInput!: ElementRef<HTMLInputElement>;
  
  showTermsPopup = signal(false);
  isEditingName = signal(false);
  userName = signal('Tzapul');
  tempUserName = signal('');
  
  // Review functionality
  reviewText = signal('');
  isSendingReview = signal(false);
  reviewSent = signal(false);
  
  // Theme functionality
  isDarkTheme = signal(false);
  
  // Profile picture functionality
  showProfilePicSelector = signal(false);
  selectedProfilePic = signal('profile1.jpg');
  availableProfilePics = [
    'profile1.jpg',
    'profile2.png', 
    'profile3.png',
    'profile4.png',
    'profile5.png',
    'profile6.png',
    'profile7.png'
  ];

  constructor(private profilePictureService: ProfilePictureService) {}

  ngOnInit(): void {
    // Load user name from local storage on component initialization
    const savedName = localStorage.getItem('tzapp-user-name');
    if (savedName) {
      this.userName.set(savedName);
    }
    
    // Load theme preference from local storage
    const savedTheme = localStorage.getItem('tzapp-theme');
    if (savedTheme) {
      this.isDarkTheme.set(savedTheme === 'dark');
      this.applyTheme(savedTheme === 'dark');
    }
    
    // Load profile picture from service
    this.selectedProfilePic.set(this.profilePictureService.getSelectedProfilePic()());
  }

  openTermsPopup(): void {
    this.showTermsPopup.set(true);
  }

  closeTermsPopup(): void {
    this.showTermsPopup.set(false);
  }

  startEditingName(): void {
    this.tempUserName.set(this.userName());
    this.isEditingName.set(true);
    // Focus the input field after the view updates
    setTimeout(() => {
      if (this.nameInput) {
        this.nameInput.nativeElement.focus();
        this.nameInput.nativeElement.select();
      }
    }, 0);
  }

  saveUserName(): void {
    const newName = this.tempUserName().trim();
    if (newName) {
      this.userName.set(newName);
      // Save to local storage
      localStorage.setItem('tzapp-user-name', newName);
    }
    this.isEditingName.set(false);
  }

  cancelEditingName(): void {
    this.tempUserName.set(this.userName());
    this.isEditingName.set(false);
  }

  // Review functionality
  sendReview(): void {
    const text = this.reviewText().trim();
    if (!text) {
      alert('Please enter your review before sending.');
      return;
    }

    this.isSendingReview.set(true);
    
    // Create email content
    const subject = `TzApp Review from ${this.userName()}`;
    const body = `Review from: ${this.userName()}\n\nReview:\n${text}`;
    
    // Create mailto link
    const mailtoLink = `mailto:s.hoarders@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Simulate sending (in a real app, you'd use a backend service)
    setTimeout(() => {
      this.isSendingReview.set(false);
      this.reviewSent.set(true);
      this.reviewText.set('');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        this.reviewSent.set(false);
      }, 3000);
    }, 1000);
  }

  onReviewTextChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.reviewText.set(target.value);
  }

  // Theme functionality
  toggleTheme(): void {
    const newTheme = !this.isDarkTheme();
    this.isDarkTheme.set(newTheme);
    
    // Save to local storage
    localStorage.setItem('tzapp-theme', newTheme ? 'dark' : 'light');
    
    // Apply theme to the document
    this.applyTheme(newTheme);
  }

  private applyTheme(isDark: boolean): void {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
  }

  // Profile picture functionality
  openProfilePicSelector(): void {
    this.showProfilePicSelector.set(true);
  }

  closeProfilePicSelector(): void {
    this.showProfilePicSelector.set(false);
  }

  selectProfilePic(picName: string): void {
    this.profilePictureService.setSelectedProfilePic(picName);
    this.selectedProfilePic.set(picName);
    this.closeProfilePicSelector();
  }

  getProfilePicPath(picName?: string): string {
    return this.profilePictureService.getProfilePicPath(picName);
  }
}
