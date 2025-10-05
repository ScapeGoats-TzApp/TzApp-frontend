import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfilePictureService } from '../../services/profile-picture.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.html',
  styleUrl: './loading.scss'
})
export class LoadingComponent implements OnInit {
  userName = 'Tzapul';

  constructor(
    private router: Router,
    public profilePictureService: ProfilePictureService
  ) {}

  ngOnInit() {
    // Load user name from localStorage
    const savedName = localStorage.getItem('tzapp-user-name');
    if (savedName) {
      this.userName = savedName;
    }

    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 2000);
  }
}
